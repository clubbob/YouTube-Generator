"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface SubMenuItem {
  title: string;
  href?: string;
  subItems?: { title: string; href?: string }[];
}

const menuItems: SubMenuItem[] = [
  {
    title: "1. 유튜브 채널 만들기",
    subItems: [
      { title: "1-1. 채널 컨셉 설정", href: "/process/1/1" },
      { title: "1-2. 채널 만들기", href: "/process/1/2" },
    ],
  },
  {
    title: "2. 영상 대본 만들기",
    subItems: [
      { title: "2-1. 인기 영상 벤치마킹", href: "/trending" },
      { title: "2-2. 대본 만들기", href: "/process/2/3" },
    ],
  },
  {
    title: "3. 영상 만들기",
    href: "/process/3",
    subItems: [
      { title: "3-1. 브르 (Vrew) AI 서비스 활용", href: "/process/3" },
    ],
  },
  {
    title: "4. 영상 샘플 보기",
    href: "https://www.youtube.com/@%EC%95%A4%EB%94%94%EB%A6%AC%EC%8A%A4%ED%8A%B8",
    subItems: [
      { title: "4-1. 앤디리스트 채널 보기", href: "https://www.youtube.com/@%EC%95%A4%EB%94%94%EB%A6%AC%EC%8A%A4%ED%8A%B8" },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenIndex, setMobileOpenIndex] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 인증 상태 확인
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        setIsAuthenticated(data.authenticated || false);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [pathname]); // 경로가 변경될 때마다 인증 상태 재확인

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" className="logo">
          YouTube Generator
        </Link>
        {isAuthenticated && (
          <button
            className={`mobile-menu-toggle ${mobileMenuOpen ? "mobile-open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴 열기/닫기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}
        <nav className={`header-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {isAuthenticated && (
            <div
              className="nav-item-wrapper main-menu"
              onMouseEnter={() => {
                if (window.innerWidth > 768) {
                  setIsMenuOpen(true);
                }
              }}
              onMouseLeave={(e) => {
                if (window.innerWidth > 768) {
                  const relatedTarget = e.relatedTarget;
                  if (!relatedTarget || 
                      !(relatedTarget instanceof HTMLElement) ||
                      (!relatedTarget.closest('.main-menu') && 
                       !relatedTarget.closest('.menu-dropdown'))) {
                    setIsMenuOpen(false);
                    setHoveredIndex(null);
                  }
                }
              }}
            >
              <div 
                className="nav-item-main"
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    setIsMenuOpen(!isMenuOpen);
                  }
                }}
              >
                <span className="nav-link main-menu-link">
                  유튜브 영상 제작 가이드
                </span>
              </div>
            {isMenuOpen && (
              <div 
                className="menu-dropdown"
                onMouseEnter={() => {
                  if (window.innerWidth > 768) {
                    setIsMenuOpen(true);
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth > 768) {
                    const relatedTarget = e.relatedTarget;
                    if (!relatedTarget || 
                        !(relatedTarget instanceof HTMLElement) ||
                        (!relatedTarget.closest('.main-menu') && 
                         !relatedTarget.closest('.menu-dropdown'))) {
                      setIsMenuOpen(false);
                      setHoveredIndex(null);
                    }
                  }
                }}
              >
                {menuItems.map((item, index) => (
                  <div
                    key={index}
                    className="menu-item"
                    onMouseEnter={() => {
                      if (window.innerWidth > 768 && item.subItems) {
                        setHoveredIndex(index);
                      }
                    }}
                    onMouseLeave={() => {
                      if (window.innerWidth > 768) {
                        setHoveredIndex(null);
                      }
                    }}
                  >
                    {item.href ? (
                      item.href.startsWith("http") ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="menu-link"
                          onClick={(e) => {
                            if (item.subItems && window.innerWidth <= 768) {
                              e.preventDefault();
                              setMobileOpenIndex(mobileOpenIndex === index ? null : index);
                            } else if (!item.subItems) {
                              setMobileMenuOpen(false);
                              setIsMenuOpen(false);
                            }
                          }}
                        >
                          {item.title}
                          {item.subItems && <span className="arrow">▶</span>}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className={`menu-link ${pathname === item.href ? "active" : ""}`}
                          onClick={(e) => {
                            if (window.innerWidth <= 768 && item.subItems) {
                              e.preventDefault();
                              setMobileOpenIndex(mobileOpenIndex === index ? null : index);
                            } else if (!item.subItems) {
                              setMobileMenuOpen(false);
                              setIsMenuOpen(false);
                            }
                          }}
                        >
                          {item.title}
                          {item.subItems && <span className="arrow">▶</span>}
                        </Link>
                      )
                    ) : (
                      <div 
                        className="menu-link"
                        onClick={() => {
                          if (window.innerWidth <= 768 && item.subItems) {
                            setMobileOpenIndex(mobileOpenIndex === index ? null : index);
                          }
                        }}
                      >
                        {item.title}
                        {item.subItems && <span className="arrow">▶</span>}
                      </div>
                    )}
                    {item.subItems && (
                      <div 
                        className={`submenu ${hoveredIndex === index ? "show" : ""} ${mobileOpenIndex === index ? "mobile-show" : ""}`}
                        onMouseEnter={() => {
                          if (window.innerWidth > 768) {
                            setHoveredIndex(index);
                            setIsMenuOpen(true);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (window.innerWidth > 768) {
                            const relatedTarget = e.relatedTarget;
                            if (!relatedTarget || 
                                !(relatedTarget instanceof HTMLElement) ||
                                (!relatedTarget.closest('.menu-item') && 
                                 !relatedTarget.closest('.submenu'))) {
                              setHoveredIndex(null);
                            }
                          }
                        }}
                      >
                        {item.subItems.map((subItem, subIndex) => (
                          subItem.href && subItem.href.startsWith("http") ? (
                            <a
                              key={subIndex}
                              href={subItem.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="submenu-item"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setIsMenuOpen(false);
                                setMobileOpenIndex(null);
                              }}
                            >
                              {subItem.title}
                            </a>
                          ) : (
                            <Link
                              key={subIndex}
                              href={subItem.href || "#"}
                              className={`submenu-item ${pathname === subItem.href ? "active" : ""}`}
                              onClick={(e) => {
                                if (!subItem.href) {
                                  e.preventDefault();
                                }
                                setMobileMenuOpen(false);
                                setIsMenuOpen(false);
                                setMobileOpenIndex(null);
                              }}
                            >
                              {subItem.title}
                            </Link>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
          {isAuthenticated && (
            <button onClick={handleLogout} className="logout-button">
              로그아웃
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
