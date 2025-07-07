# Economic Toolkit & Retirement Planner

A comprehensive financial planning application featuring a business news digest and personalized retirement planning tools.

## Features

### Business News Digest
- Real-time business headlines from trusted sources
- MongoDB-backed article storage
- Clean, modern news interface with category filtering

### Retirement Planner
- Detailed financial profile input
- AI-powered retirement plan generation
- Interactive savings projections and charts
- Similar profile matching for personalized recommendations
- Cached plan generation to avoid redundant calculations

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.10+)
- MongoDB database
- NewsAPI key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your MongoDB URI and NewsAPI key

5. Start the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 4000
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
NEWSAPI_KEY=your_newsapi_key
PORT=4000
```

### Frontend (.env)
```
VITE_HUGGINGFACE_TOKEN=your_huggingface_token_here
VITE_API_BASE_URL=/api
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | Fetch news articles with optional category and limit |
| POST | `/api/retirement/plan` | Generate personalized retirement plan |
| POST | `/api/retirement/feedback` | Submit plan feedback |

## Project Structure
```
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── retirement_planner.py   # Retirement planning logic
│   ├── news_fetcher.py         # News API integration
│   └── database.py             # MongoDB operations
├── src/
│   ├── components/             # React components
│   ├── pages/                  # Page components
│   ├── services/               # API services
│   └── contexts/               # React contexts
```

## Features

### News Digest
- Real-time business news updates
- Category filtering
- Clean, responsive article layout
- Article detail views

### Retirement Planner
- Multi-step form for comprehensive financial profiling
- Interactive savings projections
- Similar profile matching
- Detailed retirement plan generation
- Plan feedback system
- Cached plan generation for repeat inputs

The planner stores generated plans in `backend/data/retirement_plan_cache.json`.
If a new request matches a previous profile, the cached plan is returned instead
of calling the language model again.

## Development

### Backend
- FastAPI for high-performance API
- MongoDB for article storage
- Scheduled news updates
- Comprehensive retirement calculation engine

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Framer Motion for animations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.