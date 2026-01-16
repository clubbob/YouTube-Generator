export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-copyright">
          © {new Date().getFullYear()} YouTube Generator. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
