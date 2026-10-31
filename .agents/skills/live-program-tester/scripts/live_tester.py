#!/usr/bin/env python3
"""
Live Program Tester & Deep Error Diagnostics Engine for Antigravity
Author: Antigravity Engineering
Description: Executes, monitors, benchmarks, and debugs real-world applications on the host Windows machine.
Captures stdout, stderr, process vitals, network ports, Windows Event Viewer crashes, and HTTP health.
"""

import sys
import os
import time
import subprocess
import json
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone

try:
    import psutil
except ImportError:
    psutil = None

def get_recent_windows_crashes(seconds=30):
    """Queries Windows Event Viewer for Application Errors in the last N seconds."""
    ps_cmd = f"""
    $cutOff = (Get-Date).AddSeconds(-{seconds})
    Get-WinEvent -FilterHashtable @{{LogName='Application'; ProviderName='Application Error'; StartTime=$cutOff}} -ErrorAction SilentlyContinue |
    Select-Object -First 3 TimeCreated, Id, Message | ForEach-Object {{
        [PSCustomObject]@{{
            Time = $_.TimeCreated.ToString('o')
            EventId = $_.Id
            Details = $_.Message
        }}
    }} | ConvertTo-Json -Compress
    """
    try:
        res = subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps_cmd],
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        output = res.stdout.strip()
        if output:
            try:
                data = json.loads(output)
                if isinstance(data, dict):
                    return [data]
                elif isinstance(data, list):
                    return data
            except Exception:
                return [{"raw": output}]
    except Exception as e:
        return [{"error": str(e)}]
    return []

def check_port_http(port):
    """Attempts an HTTP GET request to localhost:port."""
    url = f"http://127.0.0.1:{port}/"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Antigravity-Live-Tester'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            body = resp.read(2048).decode('utf-8', errors='replace')
            return {
                "url": url,
                "status": resp.status,
                "reason": resp.reason,
                "snippet": body[:500]
            }
    except urllib.error.HTTPError as e:
        return {
            "url": url,
            "status": e.code,
            "reason": e.reason,
            "snippet": e.read(500).decode('utf-8', errors='replace')
        }
    except Exception as e:
        return {
            "url": url,
            "status": "connection_failed",
            "error": str(e)
        }

def find_listening_ports(pid):
    """Finds TCP ports opened by this process or its children."""
    if not psutil:
        return []
    ports = set()
    try:
        parent = psutil.Process(pid)
        procs = [parent] + parent.children(recursive=True)
        for proc in procs:
            try:
                for conn in proc.net_connections(kind='inet'):
                    if conn.status == psutil.CONN_LISTEN:
                        ports.add(conn.laddr.port)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception:
        pass
    return sorted(list(ports))

def run_program(cmd, cwd=None, timeout=30, is_daemon=False, env=None):
    """
    Executes a program on the real machine and collects deep diagnostics.
    """
    start_time = time.time()
    exec_cwd = os.path.abspath(cwd) if cwd else os.getcwd()
    run_env = os.environ.copy()
    if env:
        run_env.update(env)

    # Launch process
    try:
        proc = subprocess.Popen(
            cmd,
            shell=True,
            cwd=exec_cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=run_env
        )
    except Exception as e:
        return {
            "status": "LAUNCH_FAILED",
            "command": cmd,
            "cwd": exec_cwd,
            "error": str(e)
        }

    pid = proc.pid
    ps_proc = None
    if psutil:
        try:
            ps_proc = psutil.Process(pid)
        except Exception:
            pass

    max_rss_mb = 0.0
    max_cpu_percent = 0.0
    detected_ports = []
    timed_out = False

    # Monitoring loop
    poll_interval = 0.2
    max_wait = timeout if not is_daemon else min(timeout, 8)

    while True:
        elapsed = time.time() - start_time
        ret = proc.poll()
        if ret is not None:
            # Process terminated naturally
            break

        # Check process metrics
        if ps_proc:
            try:
                mem = ps_proc.memory_info().rss / (1024 * 1024)
                if mem > max_rss_mb:
                    max_rss_mb = mem
                cpu = ps_proc.cpu_percent(interval=None)
                if cpu > max_cpu_percent:
                    max_cpu_percent = cpu

                ports = find_listening_ports(pid)
                if ports:
                    detected_ports = ports
                    if is_daemon:
                        # Daemon started listening successfully
                        break
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        if elapsed >= max_wait:
            if is_daemon:
                # Daemon is running fine in background
                break
            else:
                timed_out = True
                try:
                    proc.terminate()
                except Exception:
                    pass
                break

        time.sleep(poll_interval)

    # Capture outputs
    stdout_text = ""
    stderr_text = ""
    if timed_out:
        try:
            stdout_text, stderr_text = proc.communicate(timeout=3)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
    elif is_daemon:
        # Don't wait forever on daemon streams
        try:
            # Non-blocking read or quick poll
            proc.stdout.flush()
            proc.stderr.flush()
        except Exception:
            pass
    else:
        stdout_text, stderr_text = proc.communicate()

    duration = round(time.time() - start_time, 3)
    exit_code = proc.returncode

    # Check for listening port health if daemon or server
    port_probes = {}
    for p in detected_ports:
        port_probes[str(p)] = check_port_http(p)

    # Check Windows Event Viewer crashes if abnormal termination
    crashes = []
    if exit_code is not None and exit_code != 0:
        crashes = get_recent_windows_crashes(seconds=int(duration + 15))

    # Evaluate overall status
    if timed_out:
        status = "TIMEOUT"
    elif is_daemon:
        status = "DAEMON_HEALTHY" if (exit_code is None or detected_ports) else "DAEMON_FAILED"
    elif exit_code == 0:
        status = "SUCCESS"
    else:
        status = "CRASHED" if crashes else "FAILED"

    # Assemble report
    report = {
        "status": status,
        "command": cmd,
        "pid": pid,
        "cwd": exec_cwd,
        "duration_seconds": duration,
        "exit_code": exit_code,
        "timed_out": timed_out,
        "metrics": {
            "peak_memory_mb": round(max_rss_mb, 2),
            "peak_cpu_percent": round(max_cpu_percent, 1),
            "detected_listening_ports": detected_ports
        },
        "port_probes": port_probes,
        "stdout": stdout_text.strip(),
        "stderr": stderr_text.strip(),
        "windows_event_crashes": crashes
    }

    return report

def main():
    parser = argparse.ArgumentParser(description="Live Program Tester & Deep Error Diagnostics")
    parser.add_argument("--cmd", help="The full command line to execute", default=None)
    parser.add_argument("--cwd", help="Working directory", default=None)
    parser.add_argument("--timeout", type=int, help="Execution timeout in seconds", default=25)
    parser.add_argument("--daemon", action="store_true", help="Set for long-running servers or background daemons")
    parser.add_argument("--json", action="store_true", help="Output raw JSON format only")

    args, unknown = parser.parse_known_args()
    if args.cmd:
        full_cmd = args.cmd
    elif unknown:
        full_cmd = " ".join(unknown)
    else:
        print("Error: No command provided to execute. Use --cmd '<command>' or pass command directly.")
        sys.exit(1)

    report = run_program(
        cmd=full_cmd,
        cwd=args.cwd,
        timeout=args.timeout,
        is_daemon=args.daemon
    )

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return

    # Formatted Human-Readable Summary
    status_icon = "✅" if report["status"] in ["SUCCESS", "DAEMON_HEALTHY"] else "❌"
    print("\n" + "=" * 70)
    print(f" {status_icon} LIVE EXECUTION REPORT: [{report['status']}]")
    print("=" * 70)
    print(f"• Command:       {report['command']}")
    print(f"• Working Dir:   {report['cwd']}")
    print(f"• Duration:      {report['duration_seconds']}s")
    print(f"• Exit Code:     {report['exit_code']}")
    print(f"• Peak Memory:   {report['metrics']['peak_memory_mb']} MB")
    print(f"• Peak CPU:      {report['metrics']['peak_cpu_percent']} %")
    if report['metrics']['detected_listening_ports']:
        print(f"• Open Ports:    {report['metrics']['detected_listening_ports']}")

    if report["port_probes"]:
        print("\n--- Network Probes ---")
        for p, probe in report["port_probes"].items():
            print(f"Port {p} -> Status: {probe.get('status')} | Reason: {probe.get('reason', '')}")
            if probe.get('snippet'):
                print(f"   Response Preview: {probe['snippet'][:150]}...")

    if report["stdout"]:
        print("\n--- Standard Output (stdout) ---")
        print(report["stdout"])

    if report["stderr"]:
        print("\n--- Standard Error (stderr) ---")
        print(report["stderr"])

    if report["windows_event_crashes"]:
        print("\n--- Windows Event Viewer Crashes (Event ID 1000) ---")
        for c in report["windows_event_crashes"]:
            print(f"• Crash Time: {c.get('Time')}")
            print(f"  Details: {c.get('Details')}")

    print("=" * 70 + "\n")

    sys.exit(0 if report["status"] in ["SUCCESS", "DAEMON_HEALTHY"] else 1)

if __name__ == "__main__":
    main()
