import styles from './ECommerce.module.css';

export function ECommerce() {
  return (
    <div className={styles.ecommerce}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.logo}>ShopUI</h1>
          <nav className={styles.headerNav}>
            <a href="#" className={styles.navLink}>New</a>
            <a href="#" className={styles.navLink}>Categories</a>
            <a href="#" className={styles.navLink}>Sale</a>
          </nav>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBar}>
            <input type="text" placeholder="Search products..." className={styles.searchInput} />
          </div>
          <button className={styles.iconButton}>❤️</button>
          <button className={styles.iconButton}>🛒 3</button>
          <div className={styles.avatar}>JD</div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <a href="#">Home</a>
        <span>/</span>
        <a href="#">Electronics</a>
        <span>/</span>
        <a href="#">Headphones</a>
        <span>/</span>
        <span className={styles.current}>Pro Wireless Headphones</span>
      </nav>

      {/* Product Section */}
      <main className={styles.productSection}>
        {/* Product Gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            <div className={styles.imagePlaceholder}>Product Image</div>
            <button className={styles.wishlistButton}>❤️</button>
          </div>
          <div className={styles.thumbnails}>
            <button className={`${styles.thumbnail} ${styles.active}`}>
              <div className={styles.thumbPlaceholder} />
            </button>
            <button className={styles.thumbnail}>
              <div className={styles.thumbPlaceholder} />
            </button>
            <button className={styles.thumbnail}>
              <div className={styles.thumbPlaceholder} />
            </button>
            <button className={styles.thumbnail}>
              <div className={styles.thumbPlaceholder} />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className={styles.productInfo}>
          <div className={styles.badge}>Best Seller</div>
          <h2 className={styles.productName}>Pro Wireless Headphones X1</h2>
          <div className={styles.rating}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.reviewCount}>4.8 (2,847 reviews)</span>
          </div>

          <div className={styles.pricing}>
            <span className={styles.currentPrice}>$299.99</span>
            <span className={styles.originalPrice}>$399.99</span>
            <span className={styles.discount}>25% OFF</span>
          </div>

          <p className={styles.description}>
            Premium wireless headphones with active noise cancellation, 40-hour battery life,
            and studio-quality sound. Perfect for music lovers and professionals alike.
          </p>

          <div className={styles.options}>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Color</label>
              <div className={styles.colorOptions}>
                <button className={`${styles.colorOption} ${styles.selected}`} style={{ background: '#1a1a1a' }} />
                <button className={styles.colorOption} style={{ background: '#c4b5a0' }} />
                <button className={styles.colorOption} style={{ background: '#1e40af' }} />
              </div>
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎵</span>
              <span>Hi-Res Audio</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔇</span>
              <span>Active Noise Cancellation</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔋</span>
              <span>40hr Battery</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.addToCartButton}>Add to Cart</button>
            <button className={styles.buyNowButton}>Buy Now</button>
          </div>

          <div className={styles.shipping}>
            <div className={styles.shippingItem}>
              <span className={styles.shippingIcon}>🚚</span>
              <div>
                <div className={styles.shippingTitle}>Free Shipping</div>
                <div className={styles.shippingDesc}>Arrives Dec 10-12</div>
              </div>
            </div>
            <div className={styles.shippingItem}>
              <span className={styles.shippingIcon}>↩️</span>
              <div>
                <div className={styles.shippingTitle}>30-Day Returns</div>
                <div className={styles.shippingDesc}>Free returns within 30 days</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reviews Section */}
      <section className={styles.reviewsSection}>
        <h3 className={styles.sectionTitle}>Customer Reviews</h3>

        <div className={styles.reviewsGrid}>
          <div className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewerAvatar}>MJ</div>
              <div className={styles.reviewerInfo}>
                <div className={styles.reviewerName}>Michael J.</div>
                <div className={styles.reviewDate}>December 2, 2024</div>
              </div>
              <div className={styles.reviewRating}>★★★★★</div>
            </div>
            <p className={styles.reviewText}>
              Absolutely love these headphones! The sound quality is incredible and the noise
              cancellation works perfectly. Worth every penny.
            </p>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewerAvatar}>SK</div>
              <div className={styles.reviewerInfo}>
                <div className={styles.reviewerName}>Sarah K.</div>
                <div className={styles.reviewDate}>November 28, 2024</div>
              </div>
              <div className={styles.reviewRating}>★★★★☆</div>
            </div>
            <p className={styles.reviewText}>
              Great headphones for the price. Very comfortable for long listening sessions.
              Only minor issue is the Bluetooth range could be better.
            </p>
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewerAvatar}>AT</div>
              <div className={styles.reviewerInfo}>
                <div className={styles.reviewerName}>Alex T.</div>
                <div className={styles.reviewDate}>November 25, 2024</div>
              </div>
              <div className={styles.reviewRating}>★★★★★</div>
            </div>
            <p className={styles.reviewText}>
              Been using these for work calls and music. Crystal clear audio on both ends.
              The 40-hour battery is no joke - I charge mine once a week!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
