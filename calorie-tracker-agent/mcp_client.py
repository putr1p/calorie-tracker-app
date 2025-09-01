import json
import asyncio
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class MCPClient:
    def __init__(self, host: str = '127.0.0.1', port: int = 3002):
        self.host = host
        self.port = port
        self.reader: Optional[asyncio.StreamReader] = None
        self.writer: Optional[asyncio.StreamWriter] = None
        self.request_id = 0
        self.connected = False

    async def connect(self):
        """Connect to the MCP server via TCP."""
        if self.connected:
            return

        logger.info(f"Connecting to MCP server at {self.host}:{self.port}")
        try:
            self.reader, self.writer = await asyncio.open_connection(self.host, self.port)
            self.connected = True
            logger.info(f"Connected to MCP server at {self.host}:{self.port}")
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise

    async def disconnect(self):
        """Disconnect from the MCP server."""
        if self.writer:
            logger.info("Disconnecting from MCP server")
            self.writer.close()
            await self.writer.wait_closed()
            self.connected = False
            logger.info("Disconnected from MCP server")

    async def start_server(self):
        """Connect to MCP server (for compatibility with existing code)."""
        await self.connect()

    async def stop_server(self):
        """Disconnect from MCP server (for compatibility with existing code)."""
        await self.disconnect()

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """Call a tool on the MCP server."""
        if not self.connected:
            await self.connect()

        request_id = self.request_id
        self.request_id += 1

        request = {
            "jsonrpc": "2.0",
            "id": request_id,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }

        # Send request
        request_json = json.dumps(request) + "\n"
        self.writer.write(request_json.encode())
        await self.writer.drain()

        # Read response
        response_line = await self.reader.readline()
        if not response_line:
            raise Exception("No response from MCP server")

        response = json.loads(response_line.decode().strip())

        if "error" in response:
            error_msg = f"MCP Error: {response['error']['message']}"
            logger.error(error_msg)
            raise Exception(error_msg)

        result = response["result"]["content"][0]["text"]
        return result

    async def initialize(self):
        """Initialize the MCP server."""
        if not self.connected:
            await self.connect()

        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "initialize",
            "params": {}
        }
        self.request_id += 1

        request_json = json.dumps(request) + "\n"
        self.writer.write(request_json.encode())
        await self.writer.drain()

        response_line = await self.reader.readline()
        response = json.loads(response_line.decode().strip())

        if "error" in response:
            error_msg = f"MCP Initialization Error: {response['error']['message']}"
            logger.error(error_msg)
            raise Exception(error_msg)

        logger.info("MCP server initialized")
        return response["result"]