import asyncio
import logging
import json
import sys
from mcp_client import MCPClient
from ollama_client import OllamaClient
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CalorieTrackerAgent:
    def __init__(self, mcp_host: str = '127.0.0.1', mcp_port: int = 3001):
        self.mcp_client = MCPClient(mcp_host, mcp_port)
        self.ollama_client = OllamaClient()
        self.conversation_history = []
        logger.info("Calorie Tracker Agent initialized")

    async def initialize(self):
        """Initialize the agent, MCP server, and Ollama client."""
        try:
            await self.mcp_client.initialize()
            await self.ollama_client.connect()

            # Check Ollama health
            is_healthy = await self.ollama_client.check_health()
            if not is_healthy:
                logger.warning("Ollama server not healthy, agent will work in limited mode")

            logger.info("Calorie Tracker Agent initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize: {e}")
            raise

    async def get_user_meals(self, user_id: str, date: str = None) -> str:
        """Get meals for a user on a specific date."""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")

        logger.info(f"Getting meals for user {user_id} on date {date}")

        try:
            result = await self.mcp_client.call_tool("get_user_meals", {
                "user_id": user_id,
                "date": date
            })
            return result
        except Exception as e:
            logger.error(f"Error getting user meals: {e}")
            return f"Error: {e}"

    async def process_query(self, query: str) -> str:
        """Process a user query using LLM for intelligent understanding."""
        logger.info(f"Processing query: {query}")

        try:
            # Check if Ollama is available
            is_healthy = await self.ollama_client.check_health()

            if not is_healthy:
                return "I'm sorry, but I'm currently unable to process your request. My language model service is not available. Please try again later."

            # Use LLM to understand the query and determine action
            analysis_prompt = f"""
You are a calorie tracking assistant. Analyze this user query and determine what action to take.

Available tools:
- get_user_meals: Get all meals for a specific user (requires user_id, optional date)

User query: "{query}"

Respond with a JSON object containing:
{{
  "intent": "get_meals" | "other",
  "user_id": number or null,
  "date": "YYYY-MM-DD" or null (use today's date if mentioned, yesterday if mentioned),
  "needs_tool": boolean,
  "response": "brief explanation of what you'll do"
}}

If the query is about meals, set intent to "get_meals" and extract user_id if mentioned.
If no user_id is mentioned, use 1 as default.
If date is mentioned, parse it appropriately.
"""

            analysis_response = await self.ollama_client.generate(analysis_prompt)
            logger.info(f"LLM analysis raw response: {repr(analysis_response)}")

            # Clean the response - remove markdown code blocks if present
            cleaned_response = analysis_response.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith('```'):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()

            logger.info(f"LLM analysis cleaned: {repr(cleaned_response)}")

            try:
                analysis = json.loads(cleaned_response)
                logger.info(f"Successfully parsed analysis: {analysis}")
            except json.JSONDecodeError as e:
                logger.error(f"JSON parse error: {e}")
                logger.error(f"Failed to parse: {repr(cleaned_response)}")
                return f"I'm having trouble understanding your request. Could you please rephrase it? (Error: {e})"

            # Execute the determined action
            if analysis.get("intent") == "get_meals" and analysis.get("needs_tool", False):
                user_id = analysis.get("user_id", 1)
                date = analysis.get("date")

                if not date:
                    # Default to today if no date specified
                    date = datetime.now().strftime("%Y-%m-%d")

                logger.info(f"Calling get_user_meals for user {user_id} on {date}")
                meal_data = await self.get_user_meals(str(user_id), date)

                # Use LLM to format the response nicely
                format_prompt = f"""
Format this meal data into a user-friendly response:

Raw meal data: {meal_data}

User asked: "{query}"

Provide a natural, helpful response that summarizes the meal information.
If there are no meals, explain that clearly.
"""

                formatted_response = await self.ollama_client.generate(format_prompt)
                logger.info(f"LLM format response: {repr(formatted_response)}")
                return formatted_response.strip()

            else:
                # For non-meal queries or when no tool is needed
                general_prompt = f"""
You are a calorie tracking assistant. The user asked: "{query}"

Available actions:
- I can help you get meal information for users
- I can analyze meal patterns and provide insights
- I can help with calorie tracking questions

Provide a helpful response. If this is about meals, suggest they ask about specific users.
"""

                response = await self.ollama_client.generate(general_prompt)
                logger.info(f"LLM general response: {repr(response)}")
                return response.strip()

        except Exception as e:
            logger.error(f"Error in LLM processing: {e}")
            return "I'm experiencing technical difficulties. Please try again in a moment."

    async def run_interactive(self):
        """Run the agent in interactive mode."""
        print("Calorie Tracker Agent")
        print("Type 'quit' to exit")
        print("-" * 40)

        while True:
            try:
                query = input("Query: ").strip()
                if query.lower() in ['quit', 'exit', 'q']:
                    break

                if query:
                    response = await self.process_query(query)
                    print(f"Response: {response}")
                    print("-" * 40)

            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in interactive mode: {e}")
                print(f"Error: {e}")

    async def cleanup(self):
        """Clean up resources."""
        await self.mcp_client.stop_server()
        await self.ollama_client.disconnect()
        logger.info("Calorie Tracker Agent cleanup completed")

async def main():
    # Check if running with command line arguments (non-interactive mode)
    if len(sys.argv) > 2:
        query = sys.argv[1]
        user_id = sys.argv[2]

        # Initialize Calorie Tracker Agent with MCP server connection
        agent = CalorieTrackerAgent()

        try:
            await agent.initialize()
            response = await agent.process_query(query)
            print(response)  # Output response to stdout
        except Exception as e:
            logger.error(f"Calorie Tracker Agent error: {e}")
            print(f"Error: {e}")  # Output error to stdout
            sys.exit(1)
        finally:
            await agent.cleanup()
    else:
        # Interactive mode
        # Initialize Calorie Tracker Agent with MCP server connection
        agent = CalorieTrackerAgent()

        try:
            await agent.initialize()
            await agent.run_interactive()
        except Exception as e:
            logger.error(f"Calorie Tracker Agent error: {e}")
        finally:
            await agent.cleanup()

if __name__ == "__main__":
    import sys
    asyncio.run(main())