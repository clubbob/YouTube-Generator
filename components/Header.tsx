"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface SubMenuItem {
  title: string;
  href?: string;
  subItems?: { title: string; href?: string }[];
}

const menuItems: SubMenuItem[] = [
  {
    title: "1. 유튜브 채널 만들기",
    href: "/process/1",
    subItems: [
      { title: "1-1. 채널 컨셉 설정", href: "/process/1/1" },
      { title: "1-2. 채널 만들기", href: "/process/1/2" },
    ],
  },
  {
    title: "2. 영상 대본 만들기",
    href: "/process/2",
    subItems: [
      { title: "2-1. 인기 영상 벤치마킹", href: "/trending" },
      { title: "2-2. 대본 만들기", href: "/process/2/3" },
    ],
  },
  {
    title: "3. 영상 목소리 만들기 (AI)",
    href: "/process/3",
  },
  {
    title: "4. 영상 동영상 만들기 (AI)",
    href: "/process/4",
  },
  {
    title: "5. 영상 유튜브 올리기",
    href: "/process/5",
  },
  {
    title: "6. 영상 트레픽 보기",
    href: "/process/6",
  },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileOpenIndex, setMobileOpenIndex] = useState<number | null>(null);

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
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? "mobile-open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="메뉴 열기/닫기"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`header-nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
          <div
            className="nav-item-wrapper main-menu"
            onMouseEnter={() => {
              if (window.innerWidth > 768) {
                setIsMenuOpen(true);
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth > 768) {
                const relatedTarget = e.relatedTarget as HTMLElement;
                if (!relatedTarget || 
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
                유튜브 영상 제작 프로세스
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
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    if (!relatedTarget || 
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
                      <Link
                        href={item.href}
                        className={`menu-link ${pathname === item.href ? "active" : ""}`}
                        onClick={(e) => {
                          if (window.innerWidth <= 768 && item.subItems) {
                            e.preventDefault();
                            setMobileOpenIndex(mobileOpenIndex === index ? null : index);
                          } else {
                            setMobileMenuOpen(false);
                            setIsMenuOpen(false);
                          }
                        }}
                      >
                        {item.title}
                        {item.subItems && <span className="arrow">▶</span>}
                      </Link>
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
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || 
                                (!relatedTarget.closest('.menu-item') && 
                                 !relatedTarget.closest('.submenu'))) {
                              setHoveredIndex(null);
                            }
                          }
                        }}
                      >
                        {item.subItems.map((subItem, subIndex) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
