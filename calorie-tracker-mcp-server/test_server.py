#!/usr/bin/env python3
"""
Test script for the MCP server
"""

import json
import subprocess
import asyncio
import sys
import os

class MCPTester:
    def __init__(self, server_path):
        self.server_path = server_path
        self.process = None

    async def start_server(self):
        """Start the MCP server as a subprocess"""
        print(f"Starting MCP server: {self.server_path}")

        # Check if server file exists
        if not os.path.exists(self.server_path):
            print(f"ERROR: Server file not found: {self.server_path}")
            return False

        try:
            self.process = await asyncio.create_subprocess_exec(
                'node', self.server_path,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            print("MCP server process started")
            return True
        except Exception as e:
            print(f"ERROR: Failed to start server: {e}")
            return False

    async def send_request(self, request):
        """Send a JSON-RPC request to the server"""
        if not self.process:
            print("ERROR: Server not started")
            return None

        try:
            # Send request
            request_json = json.dumps(request) + '\n'
            print(f"Sending request: {request_json.strip()}")

            self.process.stdin.write(request_json.encode())
            await self.process.stdin.drain()

            # Read response
            response_line = await self.process.stdout.readline()
            if not response_line:
                print("ERROR: No response from server")
                return None

            response_text = response_line.decode().strip()
            print(f"Raw response: {response_text}")

            response = json.loads(response_text)
            print(f"Parsed response: {json.dumps(response, indent=2)}")
            return response

        except Exception as e:
            print(f"ERROR: Failed to send request: {e}")
            return None

    async def test_basic_functionality(self):
        """Test basic MCP server functionality"""
        print("\n" + "="*50)
        print("Testing MCP Server Basic Functionality")
        print("="*50)

        # Test 1: Initialize
        print("\n1. Testing initialize...")
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {}
        }

        init_response = await self.send_request(init_request)
        if not init_response:
            return False

        if "result" in init_response:
            print("SUCCESS: Initialize successful")
        else:
            print("ERROR: Initialize failed")
            return False

        # Test 2: Tools list
        print("\n2. Testing tools/list...")
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }

        tools_response = await self.send_request(tools_request)
        if not tools_response:
            return False

        if "result" in tools_response and "tools" in tools_response["result"]:
            tools = tools_response["result"]["tools"]
            print(f"SUCCESS: Tools list successful - found {len(tools)} tools:")
            for tool in tools:
                print(f"   - {tool['name']}: {tool['description']}")
        else:
            print("ERROR: Tools list failed")
            return False

        # Test 3: Get user meals
        print("\n3. Testing get_user_meals...")
        meals_request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "get_user_meals",
                "arguments": {"userId": 1}
            }
        }

        meals_response = await self.send_request(meals_request)
        if not meals_response:
            return False

        if "result" in meals_response and "content" in meals_response["result"]:
            content = meals_response["result"]["content"]
            if content and len(content) > 0:
                meals_text = content[0]["text"]
                try:
                    meals_data = json.loads(meals_text)
                    print(f"SUCCESS: Get meals successful - found {len(meals_data)} meals")
                    if len(meals_data) > 0:
                        print(f"   Sample meal: {meals_data[0]}")
                except json.JSONDecodeError:
                    print(f"SUCCESS: Get meals successful - raw response: {meals_text[:100]}...")
            else:
                print("SUCCESS: Get meals successful - no meals found")
        else:
            print("ERROR: Get meals failed")
            return False

        print("\n" + "="*50)
        print("SUCCESS: All tests passed! MCP server is working correctly.")
        print("="*50)
        return True

    async def stop_server(self):
        """Stop the MCP server"""
        if self.process:
            print("\nStopping MCP server...")
            self.process.terminate()
            try:
                await asyncio.wait_for(self.process.wait(), timeout=5.0)
                print("MCP server stopped")
            except asyncio.TimeoutError:
                print("Force killing MCP server...")
                self.process.kill()
                await self.process.wait()

async def main():
    """Main test function"""
    # Path to the MCP server
    server_path = os.path.join(os.path.dirname(__file__), 'src', 'index.js')

    print(f"Testing MCP server at: {server_path}")

    # Create tester
    tester = MCPTester(server_path)

    # Start server
    if not await tester.start_server():
        print("Failed to start MCP server")
        return

    try:
        # Run tests
        success = await tester.test_basic_functionality()

        if success:
            print("\nSUCCESS: MCP Server Test: PASSED")
            sys.exit(0)
        else:
            print("\nERROR: MCP Server Test: FAILED")
            sys.exit(1)

    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
    finally:
        await tester.stop_server()

if __name__ == "__main__":
    asyncio.run(main())