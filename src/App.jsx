import React, { useState, useEffect } from 'react';

// Use Vite's import.meta.env to access environment variables
const API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'your-api-key-here';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://newsapi.org/v2/everything?q=';

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('technology');

  const categories = [
    { id: 'technology', name: 'Technology' },
    { id: 'sports', name: 'Sports' },
    { id: 'finance', name: 'Finance' },
    { id: 'education', name: 'Education' },
    { id: 'politics', name: 'Politics' },
    { id: 'health', name: 'Health' }
  ];

  async function fetchNews(query) {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${BASE_URL}${encodeURIComponent(query)}&apiKey=${API_KEY}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.status === "error") {
        throw new Error(data.message);
      }
      
      if (!data.articles || data.articles.length === 0) {
        setError("No news found for your search.");
        setArticles([]);
        return;
      }
      
      // Filter articles that have images
      const articlesWithImages = data.articles.filter(article => article.urlToImage);
      setArticles(articlesWithImages);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError("Failed to load news. Please try again later.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryClick(category) {
    setActiveCategory(category);
    fetchNews(category);
  }

  function handleSearch() {
    const query = searchQuery.trim();
    if (!query) return;
    
    fetchNews(query);
    setActiveCategory(''); // Clear active category when searching
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function handleReload() {
    window.location.reload();
  }

  useEffect(() => {
    fetchNews('technology');
  }, []);

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="main-nav container flex">
          <div className="company-logo" onClick={handleReload}>
            <img src="./src\assets\logo (2).png" alt="Vartapatram" />
            {/* <span className="logo-text">वार्तापत्रम्</span> */}
          </div>
          
          <div className="nav-links">
            <ul className="flex">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={`hover-link nav-item ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="search-bar flex">
            <input
              type="text"
              className="news-input"
              placeholder="Search for news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="search-button" onClick={handleSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search
            </button>
          </div>
        </div>
      </nav>

      <main className="main">
        {/* Hero Section */}
        {/* <div className="hero-section">
          <div className="hero-content">
            <div className="hero-logo">
              <img src="./src/assets/news.png" alt="Vartapatram" />
            </div>
            <h1 className="hero-title">Vartapatram</h1>
            <h2 className="hero-subtitle">Your Ultimate News Hub</h2>
            <p className="hero-description">
              Stay Informed with Comprehensive and Timely News Updates from Around the World
            </p>
          </div>
        </div> */}

        <div className="content-wrapper">
          {/* Loading State */}
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading latest news...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-container">
              <div className="error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={() => fetchNews(activeCategory || 'technology')}>
                Try Again
              </button>
            </div>
          )}

          {/* News Grid */}
          {!loading && !error && articles.length > 0 && (
            <div className="cards-container container">
              {articles.map((article, index) => (
                <div
                  key={index}
                  className="card"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <div className="card-header">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      onError={(e) => {
                        e.target.src = './src/assets/news.png';
                      }}
                    />
                    <div className="card-overlay">
                      <div className="read-more">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15,3 21,3 21,9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Read More
                      </div>
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="news-title">{article.title}</h3>
                    <h6 className="news-source">
                      {article.source.name} · {formatDate(article.publishedAt)}
                    </h6>
                    <p className="news-desc">
                      {article.description || "No description available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && articles.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
              </div>
              <h3 className="empty-title">No articles found</h3>
              <p className="empty-description">
                Try searching for different keywords or check back later for more news.
              </p>
              <button className="retry-button" onClick={() => fetchNews('technology')}>
                Load Latest News
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="./src\assets\logo (2).png" alt="Vartapatram" />
              
            </div>
            <p className="footer-text">
              Your trusted source for comprehensive news coverage from around the globe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}