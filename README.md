# Calorie Tracker App
vibe-coded with grok-code-fast-1

A modern, AI-powered calorie tracking application built with Next.js, featuring intelligent meal analysis, interactive charts, and an AI chatbot. 


## Quick Start

### Prerequisites

- **Node.js** 18+ ([Download here](https://nodejs.org/))
- **Python** 3.8+ ([Download here](https://python.org/))
- **Ollama** (for AI features) ([Download here](https://ollama.ai/))

### 1. Clone and Install Dependencies

```bash
# Install main app dependencies
npm install

# Install MCP server dependencies
cd calorie-tracker-mcp-server
npm install
cd ..

# Install Python agent dependencies
cd calorie-tracker-agent
pip install -r requirements.txt
cd ..
```

### 2. Set Up Ollama (Local LLM Features)

```bash
# Start Ollama service
ollama serve

# Pull the required AI model
ollama run gemma3:4b
```

### 3. Start the Application

You'll need **3 terminals** running simultaneously:

**Terminal 1: MCP Server**
```bash
cd calorie-tracker-mcp-server
npm start
```
*Starts the data analysis server on port 3002*

**Terminal 2: Next.js App**
```bash
npm run dev
```
*Starts the web application on http://localhost:3000*

**Terminal 3: AI Agent**
```bash
cd calorie-tracker-agent
python simple_agent.py
```
*Starts the interactive AI agent*

### 4. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### First Time Setup
1. **Register** a new account or **Login** with existing credentials
2. Navigate to the **Dashboard** to start logging meals
3. Use the **Analysis** page to view charts and AI insights

### Key Features
- **Add Meals**: Use the meal form to log food with calories
- **View Charts**: See your calorie trends over the last 7 days
- **AI Chatbot**: Ask questions like "Show me my meals" or "What's my average daily calories"
- **Meal History**: Browse through all your logged meals with pagination
- **Delete Meals**: Remove unwanted entries directly from the analysis page

## Project Structure

```
calorie-tracker-app/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── analysis/       # Analysis page with charts
│   │   ├── dashboard/      # Main dashboard
│   │   └── login/register/ # Authentication pages
│   ├── components/         # React components
│   │   ├── CalorieChart.tsx    # Interactive charts
│   │   ├── Chatbot.tsx         # AI chatbot interface
│   │   ├── MealAnalysis.tsx    # Paginated meal history
│   │   └── MealList.tsx        # Meal display component
│   └── contexts/          # React contexts
│       ├── AuthContext.tsx    # User authentication
│       └── MealsContext.tsx   # Meal data management
├── calorie-tracker-agent/ # Python AI agent
│   ├── simple_agent.py       # Main agent logic
│   ├── mcp_client.py         # MCP server communication
│   ├── ollama_client.py      # AI model integration
│   └── requirements.txt      # Python dependencies
├── calorie-tracker-mcp-server/ # Data analysis server
│   ├── src/index.js          # MCP server implementation
│   └── package.json          # Node dependencies
├── calorie_tracker.db       # SQLite database (auto-created)
└── README.md
```

## Development Commands

### Main Application
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
```

### MCP Server
```bash
cd calorie-tracker-mcp-server
npm start            # Start MCP server
npm run test:manual  # Run manual tests
npm run test:integration # Run integration tests
```

### AI Agent
```bash
cd calorie-tracker-agent
python simple_agent.py "query" user_id  # Process specific query
python simple_agent.py                 # Interactive mode
```

## Configuration

### Environment Variables

Create `.env.local` in the root directory:

```env
# Ollama Configuration (for AI features)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

```

### Database

The SQLite database (`calorie_tracker.db`) is automatically created when you first run the application. It includes:
- **Users table** - User accounts and authentication
- **Meals table** - Meal entries with calories and timestamps

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run MCP server tests
cd calorie-tracker-mcp-server
npm run test:all
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.