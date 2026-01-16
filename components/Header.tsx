"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface MenuItem {
  title: string;
  href?: string;
  subItems?: { title: string; href?: string }[];
}

const menuItems: MenuItem[] = [
  {
    title: "1. 유튜브 채널 만들기",
    subItems: [
      { title: "1-1. 채널 컨셉 정하기 (AI Prompt)" },
      { title: "1-2. 채널 만들기" },
    ],
  },
  {
    title: "2. 영상 대본 만들기",
    subItems: [
      { title: "2-1. 최근 뉴스 조회" },
      { title: "2-2. 인기 영상 벤치마킹", href: "/trending" },
      { title: "2-3. 대본 만들기 (AI Prompt)" },
    ],
  },
  {
    title: "3. 영상 목소리 만들기 (AI)",
  },
  {
    title: "4. 영상 동영상 만들기 (AI)",
  },
  {
    title: "5. 영상 유튜브 올리기",
  },
  {
    title: "6. 영상 트레픽 보기",
  },
];

export default function Header() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 모바일 메뉴가 열릴 때 body 스크롤 막기
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
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="nav-item-wrapper"
              onMouseEnter={() => item.subItems && setOpenMenu(index)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <div 
                className="nav-item-main"
                onClick={(e) => {
                  if (item.subItems && window.innerWidth <= 768) {
                    e.preventDefault();
                    setOpenMenu(openMenu === index ? null : index);
                  }
                }}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`nav-link ${pathname === item.href ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span className="nav-link">{item.title}</span>
                )}
                {item.subItems && (
                  <span className="dropdown-arrow">▼</span>
                )}
              </div>
              {item.subItems && openMenu === index && (
                <div className="dropdown-menu">
                  {item.subItems.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      href={subItem.href || "#"}
                      className={`dropdown-item ${pathname === subItem.href ? "active" : ""}`}
                      onClick={(e) => {
                        if (!subItem.href) {
                          e.preventDefault();
                        }
                        setMobileMenuOpen(false);
                      }}
                    >
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
