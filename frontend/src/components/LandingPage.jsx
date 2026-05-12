import React, { useEffect, useState } from 'react';
import { Terminal, Music, ChefHat, Globe, Paintbrush } from 'lucide-react';
import '../components/styles/LandingPage.css';
import Logo from '../assets/logo.png'

const LandingPage = ({ goToLogin }) => {
    const [activeSection, setActiveSection] = useState('top');
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const sectionIds = ['top', 'how-it-works', 'features', 'contact'];
        const offset = 140; // navbar + margin

        function onScroll() {
            const scrollPos = window.scrollY + offset;
            let current = 'top';
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (!el) continue;
                const top = el.offsetTop;
                if (scrollPos >= top) current = id;
            }

            setActiveSection((prev) => {
                if (prev === current) return prev;
                return current;
            });

            const linkHow = document.getElementById('link-how');
            const linkFeatures = document.getElementById('link-features');
            const linkTop = document.getElementById('link-top');
            if (linkHow) linkHow.classList.toggle('active', current === 'how-it-works');
            if (linkFeatures) linkFeatures.classList.toggle('active', current === 'features');
            if (linkTop) linkTop.classList.toggle('large', current === 'top');
        }

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const elements = Array.from(document.querySelectorAll('[data-animate]'));
        if (!elements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

        elements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="app-body" id="top">
            {/* TopNavBar */}
            <nav className="navbar">
                <div className="nav-left">
                    <a 
                        href="#top" 
                        id="link-top" 
                        className="logo" 
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                        onClick={(e)=>{
                            e.preventDefault(); 
                            document.getElementById('top')?.scrollIntoView({behavior:'smooth'}); 
                            setActiveSection('top'); 
                            setMenuOpen(false);
                        }}
                    >
                        <img 
                            src={Logo} 
                            alt="SwapWise Logo" 
                            style={{ width: '25px', height: '25px', objectFit: 'contain' }} 
                        />
                        SwapWise
                    </a>
                    <div className="nav-links">
                        <a href="#how-it-works" id="link-how" onClick={(e)=>{e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'}); setActiveSection('how-it-works');}}>How it Works</a>
                        <a href="#features" id="link-features" onClick={(e)=>{e.preventDefault(); document.getElementById('features')?.scrollIntoView({behavior:'smooth'}); setActiveSection('features');}}>Features</a>
                    </div>
                </div>
                <div className="nav-right">
                    <button className="btn-text" onClick={goToLogin}>Sign In</button>
                    <button className="btn-primary">Get Started</button>
                </div>
                <button
                    className={`nav-toggle ${menuOpen ? 'open' : ''}`}
                    aria-expanded={menuOpen}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    onClick={() => setMenuOpen(v => !v)}
                >
                    <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
                </button>
            </nav>

            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} role="dialog" aria-hidden={!menuOpen}>
                <div className="mobile-links">
                    <a href="#how-it-works" onClick={(e)=>{e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({behavior:'smooth'}); setMenuOpen(false); setActiveSection('how-it-works');}}>How it Works</a>
                    <a href="#features" onClick={(e)=>{e.preventDefault(); document.getElementById('features')?.scrollIntoView({behavior:'smooth'}); setMenuOpen(false); setActiveSection('features');}}>Features</a>
                </div>
                <div className="mobile-actions">
                    <button className="btn-text" onClick={() => { setMenuOpen(false); goToLogin(); }}>Sign In</button>
                    <button className="btn-primary" onClick={()=>setMenuOpen(false)}>Get Started</button>
                </div>
            </div>

            <main className="main-content">
                {/* Hero Section */}
                <section className="hero">
                        <div className="hero-text" data-animate="fade-up">
                            <h1 data-animate="zoom">Trade Your Talents. <br/>Master New Skills.</h1>
                            <p data-animate="fade-up">Join the community where your knowledge is your currency. Match with partners, swap skills, and learn together.</p>
                            <button className="btn-primary btn-large cta-button" data-animate="zoom" style={{'--delay':'80ms'}}>
                                Start Swapping Today
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                        
                        <div className="node floating-node pos-1 rotate-neg" data-animate="fade-left" style={{'--delay':'120ms'}}>
                            <span className="material-symbols-outlined icon-primary">code</span>
                        </div>
                        <div className="node floating-node pos-2 rotate-pos" data-animate="fade-right" style={{'--delay':'160ms'}}>
                            <span className="material-symbols-outlined icon-primary icon-medium">music_note</span>
                        </div>
                        <div className="node floating-node pos-3 rotate-pos-small" data-animate="fade-left" style={{'--delay':'200ms'}}>
                            <span className="material-symbols-outlined icon-primary icon-medium">translate</span>
                        </div>
                        <div className="node floating-node pos-4 rotate-neg-large" data-animate="fade-right" style={{'--delay':'220ms'}}>
                            <span className="material-symbols-outlined icon-primary">restaurant_menu</span>
                        </div>
                </section>

                {/* Categories */}
                <section className="categories-section">
                    <p className="section-label" data-animate="fade-up">Popular Categories</p>
                    <div className="categories-grid">
                        <div className="category-card" data-animate="zoom" style={{'--delay':'40ms'}}>
                            <div className="category-icon-wrapper">
                                <Terminal size={24} color="var(--primary-container)" />
                            </div>
                            <span>Programming</span>
                        </div>
                        <div className="category-card" data-animate="zoom" style={{'--delay':'80ms'}}>
                            <div className="category-icon-wrapper">
                                <Music size={24} color="var(--primary-container)" />
                            </div>
                            <span>Music</span>
                        </div>
                        <div className="category-card" data-animate="zoom" style={{'--delay':'120ms'}}>
                            <div className="category-icon-wrapper">
                                <ChefHat size={24} color="var(--primary-container)" />
                            </div>
                            <span>Cooking</span>
                        </div>
                        <div className="category-card" data-animate="zoom" style={{'--delay':'160ms'}}>
                            <div className="category-icon-wrapper">
                                <Globe size={24} color="var(--primary-container)" />
                            </div>
                            <span>Languages</span>
                        </div>
                        <div className="category-card" data-animate="zoom" style={{'--delay':'200ms'}}>
                            <div className="category-icon-wrapper">
                                <Paintbrush size={24} color="var(--primary-container)" />
                            </div>
                            <span>Design</span>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="how-it-works">
                    <div className="section-header text-center">
                        <h2>How It Works</h2>
                        <p>A simple, intelligent process to start learning and sharing your expertise.</p>
                    </div>
                    
                    <div className="steps-container">
                        <div className="connecting-line"></div>
                        <div className="step-item" data-animate="fade-up">
                            <div className="step-icon">
                                <span className="material-symbols-outlined filled">person_add</span>
                            </div>
                            <h3>Build Profile</h3>
                            <p>List what you can teach and what you want to learn.</p>
                        </div>
                        <div className="step-item" data-animate="fade-up" style={{'--delay':'60ms'}}>
                            <div className="step-icon">
                                <span className="material-symbols-outlined filled icon-green">hub</span>
                            </div>
                            <h3>Get Matched</h3>
                            <p>Our smart algorithm finds your perfect skill exchange partner.</p>
                        </div>
                        <div className="step-item" data-animate="fade-up" style={{'--delay':'100ms'}}>
                            <div className="step-icon">
                                <span className="material-symbols-outlined filled">calendar_month</span>
                            </div>
                            <h3>Chat & Book</h3>
                            <p>Connect safely via message and schedule your session.</p>
                        </div>
                        <div className="step-item" data-animate="fade-up" style={{'--delay':'140ms'}}>
                            <div className="step-icon bg-green">
                                <span className="material-symbols-outlined filled icon-white">school</span>
                            </div>
                            <h3>Learn & Grow</h3>
                            <p>Exchange knowledge over video call and leave reviews.</p>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features-wrapper">
                    <div className="feature-split">
                        <div className="abstract-bg">
                            <svg viewBox="0 0 600 800">
                                <circle cx="450" cy="150" r="4" className="dot-cyan"></circle>
                                <circle cx="550" cy="250" r="3" className="dot-cyan"></circle>
                                <circle cx="150" cy="550" r="4" className="dot-blue"></circle>
                                <circle cx="250" cy="750" r="3" className="dot-blue"></circle>
                                <path d="M50 400 L250 450 L450 150 M450 150 L550 250" className="line-blue"></path>
                                <path d="M250 450 L150 550 L250 750" className="line-blue"></path>
                            </svg>
                        </div>
                        <div className="feature-text">
                            <div className="badge">The Algorithm</div>
                            <h2>Intelligent Matchmaking</h2>
                            <p>Stop scrolling endlessly. Our proprietary algorithm considers skill levels, timezones, and learning styles to present you with partners who are a genuine fit for mutual growth.</p>
                            <ul className="feature-list">
                                <li>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span>Complementary skill pairing</span>
                                </li>
                                <li>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span>Timezone alignment</span>
                                </li>
                            </ul>
                        </div>
                        <div className="feature-visual">
                            <div className="mockup-card" data-animate="fade-up">
                                <div className="mockup-header">
                                    <div className="avatar glow-avatar">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div className="avatar-info">
                                        <h4>SARAH J.</h4>
                                        <p>Fluent in French • Wants to learn Python</p>
                                    </div>
                                </div>
                                <div className="mockup-body">
                                    <div className="skill-tags">
                                        <div className="skill-tag">
                                            <div className="tag-icon"><span className="material-symbols-outlined">outlined_flag</span></div>
                                            <span>French</span>
                                        </div>
                                        <div className="skill-tag">
                                            <div className="tag-icon"><span className="material-symbols-outlined">code</span></div>
                                            <span>Python</span>
                                        </div>
                                    </div>
                                    <div className="match-score glow-score">
                                        <svg>
                                            <circle cx="56" cy="56" r="46" className="track"></circle>
                                            <circle cx="56" cy="56" r="46" className="progress"></circle>
                                        </svg>
                                        <span>95%</span>
                                    </div>
                                </div>
                                <button className="btn-action">PROPOSE SWAP</button>
                            </div>
                        </div>
                    </div>

                    <div className="feature-split">
                        <div className="feature-visual">
                            <div className="chat-mockup-wrapper">
                                <div className="chat-bubbles">
                                    <div className="bubble left bubble-cyan">
                                        <span className="material-symbols-outlined">share</span>
                                        <div className="line dark-line"></div>
                                    </div>
                                    <div className="bubble right bubble-dark">
                                        <span className="material-symbols-outlined">ads_click</span>
                                        <div className="line light-line"></div>
                                    </div>
                                    <div className="bubble left bubble-blue">
                                        <span className="material-symbols-outlined">chat_bubble</span>
                                        <div className="line dark-line"></div>
                                    </div>
                                </div>
                                <div className="session-card elevated" data-animate="fade-up">
                                    <div className="session-icon-wrapper">
                                        <span className="material-symbols-outlined large-icon">calendar_month</span>
                                        <div className="mini-icon">
                                            <span className="material-symbols-outlined">schedule</span>
                                        </div>
                                    </div>
                                    <div className="session-info">
                                        <p className="label">SESSION REQUEST:</p>
                                        <p className="time">Thu, Oct 24 - 8:00 PM EST</p>
                                    </div>
                                    <button className="btn-success">ACCEPT</button>
                                </div>
                            </div>
                        </div>
                        <div className="feature-text">
                            <div className="badge">Communication</div>
                            <h2>Seamless Scheduling & Chat</h2>
                            <p>Discuss goals, share resources, and lock in your session times without ever leaving the platform. Integrated calendars make time-zone math a thing of the past.</p>
                            <a href="#" className="explore-link">
                                Explore Features
                                <span className="material-symbols-outlined">chevron_right</span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="bottom-cta">
                    <div className="blob blob-green"></div>
                    <div className="blob blob-light-green"></div>
                    <div className="cta-content" data-animate="fade-up">
                        <h2 data-animate="zoom">Ready to share what you know?</h2>
                        <p data-animate="fade-up">Join thousands of lifelong learners who are already trading skills, making connections, and growing together.</p>
                        <div className="cta-buttons" data-animate="zoom" style={{'--delay':'60ms'}}>
                            <button className="btn-success btn-large">Create Free Profile</button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="massive-footer" id="contact">
                <div className="footer-top-grid">
                    <div className="footer-brand-desc" data-animate="fade-up">
                        SwapWise is the skill exchange platform that builds a thriving learning community all in one place.
                    </div>
                    <div className="footer-nav-columns">
                        <div className="nav-col">
                            <h4>Platform</h4>
                            <a href="#how-it-works">How it Works</a>
                            <a href="#features">Features</a>
                        </div>
                    </div>
                    <div className="footer-social">
                        <h4>Follow us</h4>
                        <div className="social-icons">
                            <a href="#" className="social-box" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            </a>
                            <a href="#" className="social-box" aria-label="X (Twitter)">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16m0-16L4 20"></path></svg>
                            </a>
                            <a href="#" className="social-box" aria-label="TikTok">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;