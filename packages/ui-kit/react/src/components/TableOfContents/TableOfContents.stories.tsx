import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useRef, useEffect } from 'react';
import { TableOfContents } from './TableOfContents';

// Decorator to fix Storybook's overflow:auto which breaks sticky positioning
const FixStickyDecorator = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const wrapper = document.querySelector('.storyWrapper');
    if (wrapper instanceof HTMLElement) {
      wrapper.style.overflow = 'visible';
    }
    return () => {
      // Restore on unmount
      if (wrapper instanceof HTMLElement) {
        wrapper.style.overflow = '';
      }
    };
  }, []);
  return <>{children}</>;
};

const meta = {
  title: 'Navigation/TableOfContents',
  component: TableOfContents,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <FixStickyDecorator>
        <Story />
      </FixStickyDecorator>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A sticky table of contents that automatically extracts headings from the page
and highlights the currently visible section as the user scrolls.

## When to Use

- Long-form documentation or article pages
- Learning/tutorial content with multiple sections
- Reference pages with many subsections
- Any scrollable content where quick navigation is helpful

## Features

| Feature | Description |
|---------|-------------|
| Auto-extraction | Automatically finds headings in a container |
| Scroll tracking | Highlights the currently visible section |
| Smooth scrolling | Clicking an item smoothly scrolls to that section |
| Manual override | Click selection is preserved while section is visible |
| Responsive | Hides on smaller screens (< 1100px) |

## Scroll Behavior

The TOC intelligently handles different scroll scenarios:

- **Click to scroll**: Selection stays on clicked item while visible
- **Manual scroll**: Updates selection based on viewport position
- **Scroll offset**: Configurable offset for sticky headers

## Accessibility

- \`role="navigation"\` with \`aria-label\` for screen readers
- Keyboard navigable (Tab through items, Enter/Space to activate)
- \`aria-current="location"\` on active item
- Focus visible ring on all items

## Usage

\`\`\`tsx
import { TableOfContents } from '@claude-flow/ui-kit-react';

// Automatic extraction from article
<div style={{ display: 'flex' }}>
  <article>
    <h2 id="intro">Introduction</h2>
    <p>Content...</p>
    <h2 id="setup">Setup</h2>
    <p>Content...</p>
  </article>
  <TableOfContents containerSelector="article" />
</div>

// Manual items
<TableOfContents
  items={[
    { id: 'intro', text: 'Introduction', level: 2 },
    { id: 'setup', text: 'Setup', level: 2 },
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    onActiveChange: fn(),
  },
  argTypes: {
    containerSelector: {
      control: 'text',
      description: 'CSS selector for the content container',
    },
    headingSelector: {
      control: 'text',
      description: 'CSS selector for headings to include',
    },
    title: {
      control: 'text',
      description: 'Title shown above the TOC list',
    },
    scrollOffset: {
      control: 'number',
      description: 'Offset from top of viewport for scroll detection (pixels)',
    },
    items: {
      control: 'object',
      description: 'Manually provided items (skips auto-extraction)',
    },
    onActiveChange: {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content for stories - extended for proper scroll testing
const SampleArticle = () => (
  <article style={{ maxWidth: '700px', lineHeight: 1.7 }}>
    <h1>Getting Started with UI-Kit</h1>
    <p style={{ marginBottom: '2rem', color: 'var(--page-text-soft)' }}>
      A comprehensive guide to using the UI-Kit design token system. This guide
      covers everything from initial setup to advanced customization techniques.
    </p>

    <section style={{ marginBottom: '3rem' }}>
      <h2 id="installation">Installation</h2>
      <p>
        UI-Kit is a CSS-based design token system. You can use it with any
        framework or vanilla HTML/CSS. The tokens are provided as CSS custom
        properties that automatically adapt to light/dark mode.
      </p>
      <pre
        style={{
          background: 'var(--inset-bg)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto',
        }}
      >
        npm install @ui-kit/core
      </pre>
      <p>
        After installation, import the tokens stylesheet in your application
        entry point. This will make all design tokens available as CSS custom
        properties throughout your application.
      </p>
      <p>
        The installation process is straightforward and works with all major
        package managers including npm, yarn, and pnpm. Simply add the package
        to your project dependencies and import the stylesheet in your main
        entry file.
      </p>
      <p>
        For projects using build tools like Vite, Webpack, or Parcel, the CSS
        import will be automatically processed and bundled with your
        application. No additional configuration is required in most cases.
      </p>
      <p>
        If you&apos;re using a CSS-in-JS solution, you can still access the
        design tokens through CSS custom properties. The tokens are defined at
        the root level and cascade down to all child elements automatically.
      </p>
      <p>
        For server-side rendering scenarios, make sure to include the stylesheet
        in your HTML head or import it on the server side to prevent flash of
        unstyled content (FOUC) during hydration.
      </p>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2 id="configuration">Configuration</h2>
      <p>
        UI-Kit can be configured through various methods. The most common
        approach is to use the theme provider component which handles theme
        switching and persistence automatically.
      </p>
      <p>
        You can also configure the system manually by setting data attributes on
        the document element. This is useful for server-side rendering or when
        you need more control over the initialization process.
      </p>
      <p>
        The configuration options include theme selection, color mode
        preferences (light, dark, or system), and various behavioral settings
        that affect how components render and respond to user interactions.
      </p>
      <p>
        For advanced use cases, you can extend the default configuration by
        providing custom token overrides. This allows you to maintain
        consistency with the design system while adapting specific values to
        match your brand guidelines.
      </p>
      <p>
        Configuration changes are reactive and will automatically update all
        components that depend on the affected tokens. This makes it easy to
        implement features like theme switching without requiring a page reload.
      </p>
      <p>
        The system also supports configuration via environment variables for
        build-time customization. This is particularly useful for white-labeling
        scenarios or when deploying the same codebase with different branding.
      </p>
      <p>
        All configuration options are fully typed in TypeScript, providing
        excellent IDE support with autocompletion and inline documentation for
        each available option.
      </p>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2 id="theming">Theming</h2>
      <p>
        The theming system supports both built-in themes and custom theme
        creation. Themes define color palettes for both light and dark modes,
        ensuring consistent contrast ratios across all components.
      </p>
      <p>
        To create a custom theme, you define a theme object with your color
        palette and register it with the theme provider. The system will
        automatically generate all necessary token values.
      </p>
      <p>
        Each theme consists of a base color palette, semantic color mappings,
        and optional overrides for specific component variants. The theming
        system uses a sophisticated algorithm to derive accessible color
        combinations from your base palette.
      </p>
      <p>
        Built-in themes include a default neutral theme, as well as several
        accent color variations. Each theme has been carefully designed to meet
        WCAG 2.1 AA contrast requirements in both light and dark modes.
      </p>
      <p>
        The theming system also supports dynamic theme switching at runtime.
        Users can change themes without losing their current state, and the
        transition between themes is smooth and visually appealing.
      </p>
      <p>
        For enterprise applications, you can define multiple brand themes and
        switch between them based on user context, organization settings, or
        other business logic requirements.
      </p>
      <p>
        Theme tokens are organized into logical categories including colors,
        typography, spacing, borders, shadows, and animations. This
        organization makes it easy to understand and customize specific aspects
        of the visual design.
      </p>
      <p>
        The theming system integrates seamlessly with CSS custom properties,
        allowing you to use theme tokens directly in your own stylesheets
        without any additional tooling or compilation steps.
      </p>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2 id="components">Components</h2>
      <p>
        UI-Kit React provides a comprehensive set of components that are built
        on top of the design token system. Each component automatically adapts
        to the current theme and respects user preferences like reduced motion.
      </p>
      <p>
        Components follow consistent patterns for sizing, spacing, and
        interaction states. This ensures that different components align
        properly when used together in layouts.
      </p>
      <p>
        The component library includes everything you need to build modern web
        applications: buttons, inputs, forms, navigation, data display,
        feedback indicators, overlays, and more. Each component is designed to
        work well both standalone and in combination with others.
      </p>
      <p>
        All components support both controlled and uncontrolled usage patterns,
        giving you flexibility in how you manage state. The API design follows
        React conventions and will feel familiar to developers with React
        experience.
      </p>
      <p>
        Component composition is a first-class concern in UI-Kit. Complex
        components are built from smaller, reusable pieces that you can also
        use directly when you need more control over the rendering.
      </p>
      <p>
        Performance is optimized throughout the library. Components use React
        best practices like proper memoization, lazy loading for heavy
        components, and efficient re-rendering strategies.
      </p>
      <p>
        Each component comes with comprehensive TypeScript definitions,
        providing excellent developer experience with type checking,
        autocompletion, and inline documentation in your IDE.
      </p>
      <p>
        The component API is designed to be stable and follows semantic
        versioning. Breaking changes are clearly communicated and migration
        guides are provided for major version updates.
      </p>
      <p>
        Storybook documentation is available for every component, showing usage
        examples, available props, and interactive playgrounds where you can
        experiment with different configurations.
      </p>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2 id="accessibility">Accessibility</h2>
      <p>
        All components are built with accessibility in mind. They include proper
        ARIA attributes, keyboard navigation support, and focus management.
        Screen reader users will have a consistent experience across the entire
        component library.
      </p>
      <p>
        The design token system ensures sufficient color contrast in both light
        and dark modes. High contrast themes are also available for users who
        need additional visual distinction.
      </p>
      <p>
        Keyboard navigation follows established patterns and conventions. Users
        can navigate through interactive elements using Tab, and activate them
        using Enter or Space. Arrow keys are used for navigation within complex
        components like menus and lists.
      </p>
      <p>
        Focus management is handled automatically for overlay components like
        modals and drawers. Focus is trapped within the overlay while it&apos;s
        open, and restored to the triggering element when it closes.
      </p>
      <p>
        All interactive components have visible focus indicators that meet WCAG
        requirements. The focus styles are designed to be clearly visible
        without being visually intrusive.
      </p>
      <p>
        Screen reader announcements are provided for dynamic content changes.
        When content updates, screen reader users are informed through live
        regions and appropriate ARIA attributes.
      </p>
      <p>
        The library supports reduced motion preferences. Users who have
        indicated a preference for reduced motion will see simplified or
        removed animations throughout the interface.
      </p>
      <p>
        All components have been tested with popular screen readers including
        VoiceOver, NVDA, and JAWS. Regular accessibility audits are performed
        to ensure compliance with WCAG 2.1 guidelines.
      </p>
      <p>
        Documentation includes accessibility considerations for each component,
        along with guidance on how to use them in accessible ways. Common
        pitfalls and best practices are highlighted.
      </p>
    </section>

    <section style={{ marginBottom: '3rem' }}>
      <h2 id="best-practices">Best Practices</h2>
      <p>
        When using UI-Kit, follow these best practices for the best results:
        always use design tokens instead of hardcoded values, leverage the
        surface system for proper contrast, and test your UI in both light and
        dark modes.
      </p>
      <p>
        Consider the semantic meaning of surfaces when choosing which one to
        use. The surface system is designed to communicate visual hierarchy and
        ensure accessibility automatically.
      </p>
      <p>
        Use the spacing tokens consistently throughout your application. The
        spacing scale is designed to create visual rhythm and help users
        understand the relationship between different elements on the page.
      </p>
      <p>
        When customizing components, prefer using the provided props and
        variants over CSS overrides. This ensures that your customizations
        remain compatible with theme changes and future updates.
      </p>
      <p>
        Test your application with different viewport sizes to ensure
        responsive behavior. The components are designed to work well across
        device sizes, but your layout may need adjustments.
      </p>
      <p>
        Use the composition patterns demonstrated in the documentation. Complex
        UIs are often easier to build and maintain when composed from smaller,
        focused components rather than monolithic structures.
      </p>
      <p>
        Keep accessibility in mind from the start. It&apos;s much easier to
        build accessible interfaces than to retrofit accessibility into an
        existing application.
      </p>
      <p>
        Take advantage of TypeScript&apos;s type checking to catch errors early.
        The type definitions provide valuable documentation and help prevent
        common mistakes.
      </p>
      <p>
        Stay up to date with the latest version of UI-Kit. Updates include bug
        fixes, performance improvements, and new features that can enhance your
        application.
      </p>
      <p>
        Engage with the community through GitHub issues and discussions. Your
        feedback helps shape the future direction of the library and ensures it
        meets real-world needs.
      </p>
    </section>
  </article>
);

// Layout wrapper for demos
const DemoLayout = ({
  children,
  toc,
}: {
  children: React.ReactNode;
  toc: React.ReactNode;
}) => (
  <div
    style={{
      display: 'flex',
      gap: 'var(--space-8)',
      padding: 'var(--space-6)',
      minHeight: '100vh',
      background: 'var(--page-bg)',
    }}
  >
    <div style={{ flex: 1 }}>{children}</div>
    <aside style={{ width: '250px', flexShrink: 0 }}>{toc}</aside>
  </div>
);

/**
 * Default example with automatic heading extraction.
 * The TOC automatically finds h2 elements in the article.
 */
export const Default: Story = {
  render: () => (
    <DemoLayout toc={<TableOfContents containerSelector="article" />}>
      <SampleArticle />
    </DemoLayout>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The default configuration automatically extracts h2 headings from an article element.',
      },
    },
  },
};

/**
 * Using a container ref for more reliable extraction during page transitions.
 */
export const WithContainerRef: Story = {
  render: function Render() {
    const articleRef = useRef<HTMLElement>(null);
    return (
      <DemoLayout toc={<TableOfContents containerRef={articleRef} />}>
        <article ref={articleRef} style={{ maxWidth: '700px', lineHeight: 1.7 }}>
          <h1>Using Container Ref</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--page-text-soft)' }}>
            Using a ref ensures reliable extraction during React transitions.
          </p>

          <section style={{ marginBottom: '3rem' }}>
            <h2 id="ref-section-1">Section One</h2>
            <p>
              When using React Router or other SPA navigation, using a ref
              ensures the TOC always finds the correct container, even during
              page transitions.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 id="ref-section-2">Section Two</h2>
            <p>
              The containerRef prop takes precedence over containerSelector when
              both are provided.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 id="ref-section-3">Section Three</h2>
            <p>
              This approach is recommended for production applications where
              reliability is important.
            </p>
          </section>
        </article>
      </DemoLayout>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Using a ref to the container element ensures reliable extraction during React transitions and navigation.',
      },
    },
  },
};

/**
 * Manually provided items for full control over the TOC content.
 */
export const ManualItems: Story = {
  args: {
    items: [
      { id: 'overview', text: 'Overview', level: 2 },
      { id: 'getting-started', text: 'Getting Started', level: 2 },
      { id: 'installation', text: 'Installation', level: 3 },
      { id: 'configuration', text: 'Configuration', level: 3 },
      { id: 'advanced', text: 'Advanced Usage', level: 2 },
      { id: 'api-reference', text: 'API Reference', level: 2 },
    ],
    title: 'Contents',
  },
  render: (args) => (
    <div style={{ padding: 'var(--space-6)', background: 'var(--page-bg)' }}>
      <div style={{ width: '250px' }}>
        <TableOfContents {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When you need full control over the TOC items, provide them manually via the `items` prop. Nested headings (level 3+) are indented automatically.',
      },
    },
  },
};

/**
 * Custom title for the TOC.
 */
export const CustomTitle: Story = {
  args: {
    title: 'Jump to section',
    items: [
      { id: 'intro', text: 'Introduction', level: 2 },
      { id: 'features', text: 'Features', level: 2 },
      { id: 'pricing', text: 'Pricing', level: 2 },
    ],
  },
  render: (args) => (
    <div style={{ padding: 'var(--space-6)', background: 'var(--page-bg)' }}>
      <div style={{ width: '250px' }}>
        <TableOfContents {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The title above the TOC list can be customized via the `title` prop.',
      },
    },
  },
};

/**
 * Including multiple heading levels (h2 and h3).
 */
export const MultipleHeadingLevels: Story = {
  render: () => (
    <DemoLayout
      toc={
        <TableOfContents
          containerSelector="article"
          headingSelector="h2, h3"
        />
      }
    >
      <article style={{ maxWidth: '700px', lineHeight: 1.7 }}>
        <h1>Building Modern Web Applications</h1>
        <p style={{ marginBottom: '2rem', color: 'var(--page-text-soft)' }}>
          A comprehensive guide covering architecture, development practices,
          and deployment strategies for scalable web applications.
        </p>

        <section style={{ marginBottom: '3rem' }}>
          <h2 id="chapter-1">Chapter 1: Architecture Fundamentals</h2>
          <p>
            Understanding application architecture is crucial for building
            maintainable and scalable web applications. This chapter covers the
            foundational concepts that will guide your architectural decisions.
          </p>
          <p>
            We&apos;ll explore various architectural patterns and help you
            understand when to apply each one based on your specific
            requirements and constraints.
          </p>

          <h3 id="section-1-1">1.1 Component Architecture</h3>
          <p>
            Component-based architecture has become the standard approach for
            building modern user interfaces. Components encapsulate structure,
            style, and behavior into reusable units that can be composed to
            create complex applications.
          </p>
          <p>
            The key to successful component architecture is finding the right
            level of abstraction. Components should be small enough to be
            reusable but large enough to be meaningful. They should have clear
            responsibilities and well-defined interfaces.
          </p>
          <p>
            When designing components, consider their props API carefully. Props
            should be intuitive and follow established conventions. Use sensible
            defaults to minimize the configuration required for common use cases.
          </p>
          <p>
            Component composition is preferred over inheritance. Build complex
            components by combining simpler ones rather than creating deep
            inheritance hierarchies. This approach is more flexible and easier
            to reason about.
          </p>

          <h3 id="section-1-2">1.2 State Management Patterns</h3>
          <p>
            State management is one of the most important aspects of frontend
            architecture. The approach you choose will significantly impact your
            application&apos;s maintainability and performance.
          </p>
          <p>
            Local component state should be your default choice. Only lift state
            up or use global state management when you have a clear need for it.
            Many applications are over-engineered with complex state management
            solutions when simpler approaches would suffice.
          </p>
          <p>
            When you do need global state, consider the different options
            available: Context API for simple cases, dedicated state management
            libraries for complex applications, and server state management
            solutions for data that primarily lives on the server.
          </p>
          <p>
            Derived state should be computed, not stored. If a value can be
            calculated from other state values, compute it when needed rather
            than storing it separately. This eliminates synchronization issues
            and reduces the surface area for bugs.
          </p>

          <h3 id="section-1-3">1.3 Data Flow Patterns</h3>
          <p>
            Understanding how data flows through your application is essential
            for debugging and optimization. Unidirectional data flow, where data
            moves in a single direction through the component tree, makes
            applications easier to understand and debug.
          </p>
          <p>
            Props flow down from parent to child components, while events flow
            up from child to parent. This clear separation of concerns makes it
            easy to trace the source of any piece of data and understand how
            changes propagate through the application.
          </p>
          <p>
            For complex data requirements, consider implementing data
            normalization. Storing data in a flat, normalized structure with
            relationships defined by IDs can significantly simplify state
            management and improve performance.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 id="chapter-2">Chapter 2: Development Practices</h2>
          <p>
            Good development practices are the foundation of high-quality
            software. This chapter covers the practices and patterns that will
            help you write clean, maintainable, and testable code.
          </p>
          <p>
            These practices have been refined over years of collective
            experience in the industry and represent the current best thinking
            on how to build reliable software.
          </p>

          <h3 id="section-2-1">2.1 Code Organization</h3>
          <p>
            How you organize your code has a significant impact on its
            maintainability. A well-organized codebase is easier to navigate,
            understand, and modify. Poor organization leads to confusion, code
            duplication, and increased risk of bugs.
          </p>
          <p>
            Feature-based organization groups all code related to a feature
            together, regardless of its technical type. This approach makes it
            easy to find all the code related to a particular feature and
            simplifies removing or modifying features.
          </p>
          <p>
            Colocation is a key principle: keep related code close together.
            Tests should live next to the code they test. Styles should live
            next to the components they style. This makes it easy to find
            everything related to a particular piece of functionality.
          </p>
          <p>
            Establish clear conventions for file naming, directory structure,
            and code organization. Document these conventions and enforce them
            through tooling when possible. Consistency is more important than
            any particular choice.
          </p>

          <h3 id="section-2-2">2.2 Testing Strategies</h3>
          <p>
            Testing is essential for building reliable software. A good test
            suite gives you confidence to make changes and catches regressions
            before they reach production.
          </p>
          <p>
            The testing pyramid suggests having many unit tests, fewer
            integration tests, and even fewer end-to-end tests. This balance
            provides good coverage while keeping tests fast and maintainable.
          </p>
          <p>
            Test behavior, not implementation. Tests that are tightly coupled to
            implementation details are brittle and break when you refactor, even
            if the behavior remains correct. Focus on testing what the code
            does, not how it does it.
          </p>
          <p>
            Write tests that document expected behavior. A developer unfamiliar
            with the code should be able to understand what it does by reading
            the tests. Good test descriptions serve as living documentation.
          </p>
          <p>
            Consider test coverage as a guide, not a goal. High coverage
            doesn&apos;t guarantee quality tests. Focus on testing critical
            paths and edge cases rather than chasing coverage metrics.
          </p>

          <h3 id="section-2-3">2.3 Performance Optimization</h3>
          <p>
            Performance is a feature. Slow applications frustrate users and can
            significantly impact business metrics. Building performant
            applications requires attention throughout the development process.
          </p>
          <p>
            Measure before optimizing. Premature optimization is the root of
            much complexity. Use profiling tools to identify actual bottlenecks
            before spending time on optimization.
          </p>
          <p>
            React provides several tools for optimization: React.memo for
            preventing unnecessary re-renders, useMemo for expensive
            computations, and useCallback for stable callback references. Use
            these tools judiciously; they have their own costs.
          </p>
          <p>
            Code splitting reduces initial bundle size by loading code on
            demand. Identify natural split points in your application and use
            dynamic imports to defer loading of non-critical code.
          </p>
          <p>
            Virtualization is essential for rendering large lists efficiently.
            Instead of rendering all items, render only those visible in the
            viewport. This can dramatically improve performance for data-heavy
            applications.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 id="chapter-3">Chapter 3: Styling Approaches</h2>
          <p>
            Choosing the right styling approach is crucial for maintainability
            and developer experience. This chapter compares different approaches
            and provides guidance on when to use each.
          </p>

          <h3 id="section-3-1">3.1 CSS Modules</h3>
          <p>
            CSS Modules provide locally-scoped styles that prevent naming
            collisions. Each class name is transformed to be unique, so you can
            use simple, meaningful names without worrying about conflicts.
          </p>
          <p>
            The main advantage of CSS Modules is that you&apos;re writing
            standard CSS. There&apos;s no new syntax to learn, and you can use
            all the CSS features you&apos;re familiar with. This also means
            great tooling support.
          </p>
          <p>
            CSS Modules work well with design systems. You can import design
            tokens and use them in your styles, maintaining consistency across
            your application while keeping styles locally scoped.
          </p>

          <h3 id="section-3-2">3.2 Design Tokens</h3>
          <p>
            Design tokens are the atomic values that define your design system:
            colors, spacing, typography, etc. Using tokens instead of hardcoded
            values ensures consistency and makes global changes easy.
          </p>
          <p>
            CSS custom properties are an excellent way to implement design
            tokens. They cascade like other CSS properties, can be changed at
            runtime, and are well-supported across browsers.
          </p>
          <p>
            Organize tokens into logical categories. Semantic tokens (like
            &quot;primary-color&quot;) should reference primitive tokens (like
            &quot;blue-500&quot;). This indirection makes theming and updates
            much easier.
          </p>
          <p>
            Document your tokens thoroughly. A token that nobody knows about
            won&apos;t get used. Create a token browser or reference page that
            makes it easy to discover and use the available tokens.
          </p>

          <h3 id="section-3-3">3.3 Responsive Design</h3>
          <p>
            Responsive design ensures your application works well across device
            sizes. This is not optional; users expect applications to work on
            their phones, tablets, and desktops.
          </p>
          <p>
            Mobile-first design means starting with the mobile layout and
            adding complexity for larger screens. This approach often results in
            cleaner, more focused designs that work well everywhere.
          </p>
          <p>
            Use relative units (rem, em, %) instead of absolute units (px) when
            possible. This makes your designs more flexible and respects user
            preferences for text size.
          </p>
          <p>
            Test on real devices, not just browser resize. Real devices have
            different characteristics: touch vs. pointer input, different pixel
            densities, and varying performance capabilities.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 id="chapter-4">Chapter 4: Deployment and Operations</h2>
          <p>
            Getting your application to production is only the beginning. This
            chapter covers deployment strategies, monitoring, and operations
            practices that ensure your application runs reliably.
          </p>

          <h3 id="section-4-1">4.1 Build and Deploy</h3>
          <p>
            A reliable build and deployment pipeline is essential for
            maintaining velocity as your team and application grow. Automate
            everything that can be automated.
          </p>
          <p>
            Continuous Integration (CI) runs tests and builds on every commit.
            This catches problems early when they&apos;re easiest to fix. A
            failing CI build should block merging to the main branch.
          </p>
          <p>
            Continuous Deployment (CD) automatically deploys successful builds
            to production. This reduces the risk of deployments by making them
            routine and enables faster iteration.
          </p>
          <p>
            Use feature flags to decouple deployment from release. This allows
            you to deploy code to production without exposing it to users, then
            gradually roll it out while monitoring for problems.
          </p>

          <h3 id="section-4-2">4.2 Monitoring and Observability</h3>
          <p>
            You can&apos;t fix what you can&apos;t see. Comprehensive monitoring
            and observability practices help you understand how your application
            is performing and quickly identify and resolve issues.
          </p>
          <p>
            Error tracking captures and aggregates errors from production. This
            helps you identify problems before users report them and understand
            the scope and impact of issues.
          </p>
          <p>
            Performance monitoring tracks metrics like page load time, time to
            interactive, and Core Web Vitals. These metrics directly impact user
            experience and should be monitored continuously.
          </p>
          <p>
            Real user monitoring (RUM) captures actual user experiences, as
            opposed to synthetic monitoring which tests from controlled
            environments. RUM data reflects what users actually see.
          </p>
          <p>
            Set up alerts for key metrics. Don&apos;t rely on manually checking
            dashboards; be notified when things go wrong so you can respond
            quickly.
          </p>
        </section>
      </article>
    </DemoLayout>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use `headingSelector="h2, h3"` to include multiple heading levels. Nested headings are automatically indented based on their level.',
      },
    },
  },
};

/**
 * With a custom scroll offset for pages with a large sticky header.
 */
export const CustomScrollOffset: Story = {
  args: {
    scrollOffset: 120,
    items: [
      { id: 'section-1', text: 'Section 1', level: 2 },
      { id: 'section-2', text: 'Section 2', level: 2 },
      { id: 'section-3', text: 'Section 3', level: 2 },
    ],
    title: 'On this page',
  },
  render: (args) => (
    <div style={{ padding: 'var(--space-6)', background: 'var(--page-bg)' }}>
      <div style={{ width: '250px' }}>
        <TableOfContents {...args} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use `scrollOffset` to adjust for sticky headers. The default is 80px; increase this value if your header is taller.',
      },
    },
  },
};
