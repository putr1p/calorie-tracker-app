import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

// Helper function to get user from JWT
async function getUserFromJWT() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded ? decoded.userId : null;
}

export async function POST(request: NextRequest) {
  try {
    // Get JWT token for authentication
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth-token')?.value;

    if (!jwtToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query from request body
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Path to the Python agent script
    const agentPath = path.join(process.cwd(), 'calorie-tracker-agent', 'simple_agent.py');

    // Spawn Python process with query and JWT token as arguments
    const pythonProcess = spawn('python', [agentPath, query, '1', jwtToken], {
      cwd: path.join(process.cwd(), 'calorie-tracker-agent'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';
    let errorOutput = '';

    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      response += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Wait for process to complete
    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Success
          resolve(NextResponse.json({ response: response.trim() }));
        } else {
          // Error
          console.error('Agent process error:', errorOutput);
          resolve(NextResponse.json({
            error: 'Agent processing failed',
            details: errorOutput
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start agent process:', error);
        resolve(NextResponse.json({
          error: 'Failed to start agent',
          details: error.message
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}