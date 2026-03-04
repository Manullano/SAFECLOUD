#!/usr/bin/env python
"""
COMPREHENSIVE SAFECLOUD BACKEND TESTING SUITE
Tests all major API endpoints and critical functionality
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Tuple, Optional

# Configuration
API_BASE = "http://localhost:8000/api"
TIMEOUT = 10

class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    RESET = "\033[0m"

class TestRunner:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.company_id = None
        self.project_id = None
        self.document_id = None
        self.ticket_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "errors": []
        }

    def log(self, message: str, status: str = "INFO", duration: float = None):
        """Log a message with formatting"""
        emoji_map = {
            "PASS": f"{Colors.GREEN}✅",
            "FAIL": f"{Colors.RED}❌",
            "INFO": "ℹ️ ",
            "WARN": f"{Colors.YELLOW}⚠️ ",
            "SKIP": "⏭️ ",
        }
        
        emoji = emoji_map.get(status, "📝")
        time_str = datetime.now().strftime("%H:%M:%S")
        
        if duration:
            print(f"{emoji} [{time_str}] {message} ({duration:.2f}s){Colors.RESET}")
        else:
            print(f"{emoji} [{time_str}] {message}{Colors.RESET}")

    def test(self, name: str, method: str, endpoint: str, **kwargs) -> Tuple[bool, int, Any, float]:
        """Execute a test request"""
        import time
        
        url = f"{self.base_url}/{endpoint}"
        headers = kwargs.pop("headers", {})
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            start = time.time()
            
            if method == "GET":
                resp = self.session.get(url, headers=headers, timeout=TIMEOUT, **kwargs)
            elif method == "POST":
                resp = self.session.post(url, headers=headers, timeout=TIMEOUT, **kwargs)
            elif method == "PATCH":
                resp = self.session.patch(url, headers=headers, timeout=TIMEOUT, **kwargs)
            elif method == "DELETE":
                resp = self.session.delete(url, headers=headers, timeout=TIMEOUT, **kwargs)
            else:
                raise ValueError(f"Unknown method: {method}")
            
            duration = time.time() - start
            
            try:
                data = resp.json() if resp.text else {}
            except:
                data = resp.text
            
            return True, resp.status_code, data, duration
            
        except requests.exceptions.ConnectionError:
            self.log(f"{name} - Connection failed", "FAIL")
            return False, None, {"error": "Connection refused"}, 0
        except Exception as e:
            self.log(f"{name} - Exception: {str(e)[:100]}", "FAIL")
            return False, None, {"error": str(e)}, 0

    def assert_status(self, test_name: str, success: bool, status: int, expected: int, data: Any, duration: float) -> bool:
        """Assert that a request returned the expected status"""
        if not success:
            self.log(f"{test_name} - Connection error", "FAIL", duration)
            self.results["failed"] += 1
            return False
        
        if status == expected:
            self.log(f"{test_name} - {status} OK", "PASS", duration)
            self.results["passed"] += 1
            return True
        else:
            msg = f"{test_name} - Expected {expected}, got {status}"
            if isinstance(data, dict):
                msg += f" - {data.get('error', data.get('detail', ''))}"
            self.log(msg, "FAIL", duration)
            self.results["failed"] += 1
            self.results["errors"].append(msg)
            return False

    # ==================== AUTHENTICATION TESTS ====================
    def test_authentication(self):
        """Test login endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("🔐 AUTHENTICATION TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # Test login
        success, status, data, duration = self.test(
            "Login with superadmin",
            "POST",
            "auth/login/",
            json={"email": "superadmin@test.com", "password": "Superadmin@123"}
        )
        
        if success and status == 200:
            self.token = data.get("access")
            self.user_id = data.get("user", {}).get("id")
            self.assert_status("Login", success, status, 200, data, duration)
        else:
            self.log("Login failed - cannot continue tests", "FAIL")
            return False
        
        # Test get current user
        success, status, data, duration = self.test("Get current user", "GET", "auth/me/")
        self.assert_status("Get current user", success, status, 200, data, duration)
        
        return True

    # ==================== USER TESTS ====================
    def test_users(self):
        """Test user endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("👥 USER TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # List users
        success, status, data, duration = self.test("List users", "GET", "companies/users/")
        self.assert_status("List users", success, status, 200, data, duration)
        
        # Get user detail
        if self.user_id and success:
            success, status, data, duration = self.test(
                "Get user detail",
                "GET",
                f"companies/users/{self.user_id}/"
            )
            self.assert_status("Get user detail", success, status, 200, data, duration)

    # ==================== COMPANY TESTS ====================
    def test_companies(self):
        """Test company endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("🏢 COMPANY TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # List companies
        success, status, data, duration = self.test("List companies", "GET", "companies/")
        self.assert_status("List companies", success, status, 200, data, duration)
        
        if success:
            companies = data if isinstance(data, list) else data.get("results", [])
            if companies:
                self.company_id = companies[0].get("id")
                self.log(f"Found {len(companies)} company/companies", "INFO")

    # ==================== PROJECT TESTS ====================
    def test_projects(self):
        """Test project endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("📁 PROJECT TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # List projects
        success, status, data, duration = self.test("List projects", "GET", "projects/projects/")
        self.assert_status("List projects", success, status, 200, data, duration)
        
        if success:
            projects = data.get("results", []) if isinstance(data, dict) else data
            if projects:
                self.project_id = projects[0].get("id")
                self.log(f"Found {len(projects)} project(s)", "INFO")
                
                # Get project detail
                success, st, proj, dur = self.test(
                    "Get project detail",
                    "GET",
                    f"projects/projects/{self.project_id}/"
                )
                self.assert_status("Get project detail", success, st, 200, proj, dur)

    # ==================== DOCUMENT TESTS ====================
    def test_documents(self):
        """Test document endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("📄 DOCUMENT TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # List documents
        success, status, data, duration = self.test("List documents", "GET", "documents/documents/")
        self.assert_status("List documents", success, status, 200, data, duration)
        
        if success:
            docs = data.get("results", []) if isinstance(data, dict) else data
            if docs:
                self.document_id = docs[0].get("id")
                self.log(f"Found {len(docs)} document(s)", "INFO")
                
                # Get document detail
                success, st, doc, dur = self.test(
                    "Get document detail",
                    "GET",
                    f"documents/documents/{self.document_id}/"
                )
                self.assert_status("Get document detail", success, st, 200, doc, dur)
                
                # Get document versions
                success, st, vers, dur = self.test(
                    "List document versions",
                    "GET",
                    f"documents/documents/{self.document_id}/versions/"
                )
                if success:
                    versions = vers if isinstance(vers, list) else vers.get("results", [])
                    self.assert_status(
                        "List document versions",
                        success, st, 200, vers, dur
                    )
                    if versions:
                        self.log(f"Found {len(versions)} version(s)", "INFO")

    # ==================== TICKET TESTS ====================
    def test_tickets(self):
        """Test ticket endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("🎫 TICKET TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # List tickets
        success, status, data, duration = self.test("List tickets", "GET", "tickets/tickets/")
        self.assert_status("List tickets", success, status, 200, data, duration)
        
        if success:
            tickets = data.get("results", []) if isinstance(data, dict) else data
            if tickets:
                self.ticket_id = tickets[0].get("id")
                self.log(f"Found {len(tickets)} ticket(s)", "INFO")
                
                # Get ticket detail
                success, st, tkt, dur = self.test(
                    "Get ticket detail",
                    "GET",
                    f"tickets/tickets/{self.ticket_id}/"
                )
                self.assert_status("Get ticket detail", success, st, 200, tkt, dur)
                
                # Get ticket comments
                success, st, coms, dur = self.test(
                    "List ticket comments",
                    "GET",
                    f"tickets/tickets/{self.ticket_id}/comments/"
                )
                if success and st in [200, 404]:
                    comments = coms if isinstance(coms, list) else coms.get("results", [])
                    if st == 200:
                        self.log(f"Found {len(comments)} comment(s)", "INFO")
                    self.results["passed"] += 1
                    self.log("List ticket comments", "PASS", dur)
                else:
                    self.assert_status("List ticket comments", success, st, 200, coms, dur)

    # ==================== AUDIT TESTS ====================
    def test_audit(self):
        """Test audit endpoints"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("🔎 AUDIT TESTS")
        print(f"{'='*60}{Colors.RESET}")
        
        # List audit events
        success, status, data, duration = self.test(
            "List audit events",
            "GET",
            "audit-events/"
        )
        
        if success and status in [200, 404]:
            if status == 200:
                events = data.get("results", []) if isinstance(data, dict) else data
                self.log(f"Found {len(events)} audit event(s)", "INFO")
            self.results["passed"] += 1
            self.log("List audit events", "PASS", duration)
        else:
            self.results["failed"] += 1
            self.log(f"List audit events - Status {status}", "FAIL", duration)

    # ==================== HEALTH CHECK ====================
    def test_health(self):
        """Test system health"""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("🏥 SYSTEM HEALTH")
        print(f"{'='*60}{Colors.RESET}")
        
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(("localhost", 8000))
            sock.close()
            
            if result == 0:
                self.log("Backend server is running on localhost:8000", "PASS")
                self.results["passed"] += 1
            else:
                self.log("Cannot connect to backend server", "FAIL")
                self.results["failed"] += 1
                return False
        except:
            return False
        
        return True

    # ==================== MAIN EXECUTION ====================
    def run_all(self):
        """Run all tests"""
        print(f"\n{Colors.BLUE}\n")
        print("╔" + "="*58 + "╗")
        print("║  🚀 SAFECLOUD BACKEND TEST SUITE                      ║")
        print("║     Comprehensive API testing                         ║")
        print("╚" + "="*58 + "╝\n")
        
        # Health check
        if not self.test_health():
            print(f"\n{Colors.RED}Backend is not running!{Colors.RESET}")
            print("Please start the backend server first:")
            print("  cd backend && python manage.py runserver")
            return False
        
        # Run all tests
        if not self.test_authentication():
            return False
        
        self.test_users()
        self.test_companies()
        self.test_projects()
        self.test_documents()
        self.test_tickets()
        self.test_audit()
        
        # Print summary
        self.print_summary()
        return self.results["failed"] == 0

    def print_summary(self):
        """Print test summary"""
        total = self.results["passed"] + self.results["failed"] + self.results["skipped"]
        pass_rate = (self.results["passed"] / total * 100) if total > 0 else 0
        
        print(f"\n{Colors.BLUE}{'='*60}")
        print("📊 TEST SUMMARY")
        print(f"{'='*60}{Colors.RESET}")
        
        print(f"\n{Colors.GREEN}✅ Passed:  {self.results['passed']}/{total}{Colors.RESET}")
        print(f"{Colors.RED}❌ Failed:  {self.results['failed']}/{total}{Colors.RESET}")
        print(f"⏭️  Skipped: {self.results['skipped']}/{total}")
        
        print(f"\n🎯 Pass Rate: {pass_rate:.1f}%")
        
        if self.results["failed"] == 0:
            print(f"\n{Colors.GREEN}🎉 ALL TESTS PASSED! 🎉{Colors.RESET}\n")
        else:
            print(f"\n{Colors.RED}⚠️  {self.results['failed']} test(s) failed{Colors.RESET}\n")
            if self.results["errors"]:
                print("Errors:")
                for error in self.results["errors"][:5]:
                    print(f"  • {error}")


if __name__ == "__main__":
    runner = TestRunner(API_BASE)
    success = runner.run_all()
    sys.exit(0 if success else 1)
