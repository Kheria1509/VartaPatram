import React, { useState, useEffect, useRef } from 'react';

// Use Vite's import.meta.env to access environment variables
const API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'your-api-key-here';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://newsapi.org/v2/everything?q=';

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('technology');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const modalSearchInputRef = useRef(null);

  const categories = [
    { id: 'technology', name: 'Technology' },
    { id: 'sports', name: 'Sports' },
    { id: 'finance', name: 'Finance' },
    { id: 'education', name: 'Education' },
    { id: 'politics', name: 'Politics' },
    { id: 'health', name: 'Health' }
  ];

  // Enhanced popular search terms with categories
  const popularSearches = [
    { text: 'artificial intelligence', category: 'Technology' },
    { text: 'climate change', category: 'Environment' },
    { text: 'cryptocurrency', category: 'Finance' },
    { text: 'space exploration', category: 'Science' },
    { text: 'renewable energy', category: 'Environment' },
    { text: 'electric vehicles', category: 'Technology' },
    { text: 'social media', category: 'Technology' },
    { text: 'cybersecurity', category: 'Technology' },
    { text: 'machine learning', category: 'Technology' },
    { text: 'blockchain', category: 'Technology' },
    { text: 'quantum computing', category: 'Science' },
    { text: 'biotechnology', category: 'Science' },
    { text: 'olympic games', category: 'Sports' },
    { text: 'world cup', category: 'Sports' },
    { text: 'stock market', category: 'Finance' },
    { text: 'inflation', category: 'Economics' }
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
    setMobileNavOpen(false);
  }

  function handleSearch(query = searchQuery) {
    const searchTerm = query.trim();
    if (!searchTerm) return;
    
    fetchNews(searchTerm);
    setActiveCategory('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Save to recent searches
    setRecentSearches((prev) => {
      const updated = [searchTerm, ...prev.filter((item) => item !== searchTerm)].slice(0, 5);
      try {
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      return updated;
    });
  }

  function handleModalSearch() {
    const query = modalSearchQuery.trim();
    if (!query) return;
    
    handleSearch(query);
    closeSearchModal();
  }

  function openSearchModal() {
    setShowSearchModal(true);
    setModalSearchQuery(searchQuery);
    document.body.classList.add('modal-open');
    
    // Focus on modal input after animation
    setTimeout(() => {
      if (modalSearchInputRef.current) {
        modalSearchInputRef.current.focus();
      }
    }, 300);
  }

  function closeSearchModal() {
    setShowSearchModal(false);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    document.body.classList.remove('modal-open');
  }

  function handleKeyPress(e, isModal = false) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex], isModal);
      } else {
        if (isModal) {
          handleModalSearch();
        } else {
          handleSearch();
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      if (isModal) {
        closeSearchModal();
      } else {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }
  }

  function generateSuggestions(value) {
    if (value.trim() === '') {
      // Show recent searches and popular categories when no input
      const suggestions = [];
      
      if (recentSearches.length > 0) {
        suggestions.push(...recentSearches.slice(0, 3).map(search => ({ 
          text: search, 
          type: 'recent',
          subtitle: 'Recent search'
        })));
      }
      
      suggestions.push(...categories.slice(0, 3).map(cat => ({ 
        text: cat.name, 
        type: 'category',
        subtitle: 'News category'
      })));
      
      suggestions.push(...popularSearches.slice(0, 4).map(search => ({ 
        text: search.text, 
        type: 'popular',
        subtitle: search.category
      })));
      
      return suggestions.slice(0, 8);
    }

    const lower = value.toLowerCase();
    const suggestions = [];

    // Add category matches
    const catMatches = categories
      .filter((c) => c.name.toLowerCase().includes(lower))
      .map(cat => ({ 
        text: cat.name, 
        type: 'category',
        subtitle: 'News category'
      }));

    // Add recent search matches
    const recentMatches = recentSearches
      .filter((s) => s.toLowerCase().includes(lower))
      .map(search => ({ 
        text: search, 
        type: 'recent',
        subtitle: 'Recent search'
      }));

    // Add popular search matches
    const popularMatches = popularSearches
      .filter((s) => s.text.toLowerCase().includes(lower))
      .map(search => ({ 
        text: search.text, 
        type: 'popular',
        subtitle: search.category
      }));

    // Combine and prioritize
    suggestions.push(...catMatches);
    suggestions.push(...recentMatches);
    suggestions.push(...popularMatches);

    // Remove duplicates and limit
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, 8);

    return uniqueSuggestions;
  }

  function handleInputChange(e, isModal = false) {
    const value = e.target.value;
    
    if (isModal) {
      setModalSearchQuery(value);
    } else {
      setSearchQuery(value);
    }
    
    setSelectedSuggestionIndex(-1);
    
    const newSuggestions = generateSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(true);
  }

  function handleSuggestionClick(suggestion, isModal = false) {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
    
    if (isModal) {
      setModalSearchQuery(suggestionText);
      handleSearch(suggestionText);
      closeSearchModal();
    } else {
      setSearchQuery(suggestionText);
      handleSearch(suggestionText);
    }
    
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setActiveCategory('');
  }

  function getSuggestionIcon(type) {
    switch (type) {
      case 'category':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>
          </svg>
        );
      case 'recent':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
      case 'popular':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        );
      default:
        return null;
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

  // Group suggestions by category for modal display
  function groupSuggestions(suggestions) {
    const grouped = {
      recent: [],
      category: [],
      popular: []
    };
    
    suggestions.forEach(suggestion => {
      if (grouped[suggestion.type]) {
        grouped[suggestion.type].push(suggestion);
      }
    });
    
    return grouped;
  }

  useEffect(() => {
    fetchNews('technology');
    // Load recent searches from localStorage
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
  }, []);

  // Close suggestions and modal on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    }
    
    function handleModalClick(e) {
      if (e.target.classList.contains('search-modal-overlay')) {
        closeSearchModal();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleModalClick);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleModalClick);
    };
  }, []);

  const groupedSuggestions = groupSuggestions(suggestions);

  return (
    <div className="app">
      {/* Search Modal */}
      <div className={`search-modal-overlay ${showSearchModal ? 'active' : ''}`}>
        <div className="search-modal">
          <div className="search-modal-header">
            <h3 className="search-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search News
            </h3>
            <button className="search-modal-close" onClick={closeSearchModal}>
              ×
            </button>
          </div>
          
          <div className="search-modal-input-container">
            <input
              ref={modalSearchInputRef}
              type="text"
              className="search-modal-input"
              placeholder="What news are you looking for?"
              value={modalSearchQuery}
              onChange={(e) => handleInputChange(e, true)}
              onKeyDown={(e) => handleKeyPress(e, true)}
              onFocus={() => {
                const newSuggestions = generateSuggestions(modalSearchQuery);
                setSuggestions(newSuggestions);
                setShowSuggestions(true);
              }}
              autoComplete="off"
            />
            <div className="search-modal-input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-modal-suggestions">
              {groupedSuggestions.recent.length > 0 && (
                <>
                  <div className="suggestion-category">Recent Searches</div>
                  {groupedSuggestions.recent.map((suggestion, index) => (
                    <div
                      key={`recent-${index}`}
                      className={`suggestion-item ${suggestions.findIndex(s => s.text === suggestion.text) === selectedSuggestionIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion, true)}
                    >
                      <div className="suggestion-icon">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-text">{suggestion.text}</div>
                        <div className="suggestion-subtitle">{suggestion.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {groupedSuggestions.category.length > 0 && (
                <>
                  <div className="suggestion-category">Categories</div>
                  {groupedSuggestions.category.map((suggestion, index) => (
                    <div
                      key={`category-${index}`}
                      className={`suggestion-item ${suggestions.findIndex(s => s.text === suggestion.text) === selectedSuggestionIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion, true)}
                    >
                      <div className="suggestion-icon">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-text">{suggestion.text}</div>
                        <div className="suggestion-subtitle">{suggestion.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              
              {groupedSuggestions.popular.length > 0 && (
                <>
                  <div className="suggestion-category">Trending</div>
                  {groupedSuggestions.popular.map((suggestion, index) => (
                    <div
                      key={`popular-${index}`}
                      className={`suggestion-item ${suggestions.findIndex(s => s.text === suggestion.text) === selectedSuggestionIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion, true)}
                    >
                      <div className="suggestion-icon">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-text">{suggestion.text}</div>
                        <div className="suggestion-subtitle">{suggestion.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <div className="search-modal-footer">
            <div className="search-modal-shortcuts">
              <div className="shortcut-item">
                <span className="shortcut-key">↵</span>
                <span>to search</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">↑↓</span>
                <span>to navigate</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">esc</span>
                <span>to close</span>
              </div>
            </div>
            <div className="search-modal-actions">
              <button className="search-modal-button secondary" onClick={closeSearchModal}>
                Cancel
              </button>
              <button className="search-modal-button" onClick={handleModalSearch}>
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav">
        <div className="main-nav container flex">
          <div className="company-logo" onClick={handleReload}>
            <img src="./src/assets/logo (2).png" alt="Vartapatram" />
          </div>
          
          <div className={`nav-links${mobileNavOpen ? ' open' : ''}`}>
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
          
          <div className="search-bar flex" ref={searchInputRef}>
            <input
              type="text"
              className="news-input"
              placeholder="Search for news..."
              value={searchQuery}
              onChange={(e) => handleInputChange(e, false)}
              onKeyDown={(e) => handleKeyPress(e, false)}
              onFocus={openSearchModal}
              autoComplete="off"
              readOnly
            />
            <button className="search-button" onClick={openSearchModal}>
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
              <img src="./src/assets/logo (2).png" alt="Vartapatram" />
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