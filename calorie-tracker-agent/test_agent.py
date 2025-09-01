import asyncio
import logging
from simple_agent import CalorieTrackerAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_agent():
    """Test the Calorie Tracker agent functionality."""
    logger.info("Starting Calorie Tracker agent test...")

    # Initialize Calorie Tracker Agent with MCP server connection
    agent = CalorieTrackerAgent()

    try:
        # Initialize the agent
        await agent.initialize()

        # Test different queries
        test_queries = [
            "Get meals for user 1",
            "Show me today's meals for user 1",
            "What meals did user 1 have yesterday?",
            "Can you help me with meal information?",
            "Show user 2's meals"
        ]

        for query in test_queries:
            logger.info(f"\n--- Testing query: '{query}' ---")
            response = await agent.process_query(query)
            print(f"Query: {query}")
            print(f"Response: {response}")
            print("-" * 50)

    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise
    finally:
        await agent.cleanup()

    logger.info("Calorie Tracker Agent test completed successfully")

if __name__ == "__main__":
    asyncio.run(test_agent())