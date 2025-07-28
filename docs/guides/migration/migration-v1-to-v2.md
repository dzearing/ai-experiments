# V1 to V2 Migration Strategy

## Overview

This document outlines the strategy for migrating from the existing v1 architecture to the new v2 monorepo structure while maintaining zero downtime and allowing gradual adoption.

## Migration Principles

- **Zero Downtime**: V1 and V2 run side-by-side throughout the migration
- **Gradual Adoption**: Users can opt-in to v2 features at their own pace
- **Data Compatibility**: Shared data storage ensures seamless transitions
- **Feature Parity**: V2 must match v1 functionality before migration
- **Rollback Capability**: Easy reversion to v1 if issues arise

## Port Allocation

| Application | Development | Production | Purpose                  |
| ----------- | ----------- | ---------- | ------------------------ |
| V1 Web      | 3000        | 3000       | Existing React app       |
| V1 Server   | 3001        | 3001       | Existing Express server  |
| V2 Web      | 4000        | 4000       | New architecture web app |
| V2 Server   | 4001        | 4001       | New architecture server  |
| Storybook   | 6006        | N/A        | Component development    |

## Migration Phases

### Phase 0: Repository Restructure

**Goal**: Reorganize without breaking v1

1. Create new directory structure
2. Move existing code to `apps/v1/`
3. Update scripts to maintain v1 functionality
4. Verify all v1 features still work
5. Set up CI/CD for new structure

**Success Criteria**:

- [ ] All v1 npm scripts work (`npm run dev`, `npm run build`, `npm run test`)
- [ ] V1 development server starts on correct ports
- [ ] V1 production build completes successfully
- [ ] All existing v1 tests pass
- [ ] CI/CD pipeline runs successfully
- [ ] No regression in user functionality
- [ ] Documentation updated for new structure

### Phase 1: Infrastructure Setup

**Goal**: Establish v2 development foundation

Parallel tasks (agent-based execution):

- Initialize pnpm workspace
- Setup Lage build orchestration
- Create shared TypeScript/ESLint configs
- Implement repo-scripts CLI
- Set up shared tooling packages

**Success Criteria**:

- [ ] `pnpm install` works from root
- [ ] `yarn dev` shows interactive menu
- [ ] All repo-scripts commands work:
  - [ ] `pnpm build` builds all packages
  - [ ] `pnpm test` runs all tests
  - [ ] `pnpm lint` checks all packages
  - [ ] `pnpm typecheck` validates types
  - [ ] `pnpm scaffold` creates new packages
- [ ] Lage correctly orders build dependencies
- [ ] Shared configs (`@claude-flow/tsconfig`, `@claude-flow/eslint-config`) resolve
- [ ] CI/CD updated to use pnpm/Lage for v2
- [ ] Developer documentation complete

### Phase 2: Core Package Development

**Goal**: Build reusable v2 packages

Parallel package development:

- Design system with Storybook
- Data bus for WebSocket management
- Shared TypeScript types
- Claude SDK wrapper
- WebSocket client library

**Success Criteria**:

- [ ] Each package has:
  - [ ] `pnpm dev` for development mode
  - [ ] `pnpm build` producing ESM in `lib/` folder
  - [ ] `pnpm test` with >80% coverage
  - [ ] `pnpm lint` passing
  - [ ] `pnpm typecheck` passing
  - [ ] Proper package.json with exports field
  - [ ] README with usage examples
- [ ] Storybook runs on port 6006 showing all components
- [ ] Package interdependencies work correctly
- [ ] TypeScript project references configured
- [ ] No circular dependencies
- [ ] All packages use ESM by default

### Phase 3: V2 Application Development

**Goal**: Create v2 apps with feature parity

1. Scaffold v2 web and server applications
2. Port features systematically:
   - Authentication & sessions
   - Core workflows
   - Data management
   - Real-time features
3. Create E2E tests covering both versions
4. Performance benchmarking

**Success Criteria**:

- [ ] V2 applications have:
  - [ ] `pnpm dev` starts on correct ports (4000/4001)
  - [ ] `pnpm build` creates optimized `dist/` bundles
  - [ ] `pnpm test` for unit tests
  - [ ] `pnpm lint` and `pnpm typecheck` pass
- [ ] Feature parity checklist:
  - [ ] User authentication works
  - [ ] All v1 API endpoints implemented
  - [ ] WebSocket connections functional
  - [ ] Data persistence working
  - [ ] UI matches v1 functionality
- [ ] E2E tests:
  - [ ] Cover critical user flows
  - [ ] Run against both v1 and v2
  - [ ] All tests passing
- [ ] Performance metrics:
  - [ ] Page load time ≤ v1
  - [ ] API response times ≤ v1
  - [ ] Memory usage comparable
  - [ ] Bundle size documented

### Phase 4: Routing & Integration

**Goal**: Enable side-by-side operation

1. Configure nginx for intelligent routing
2. Implement feature flags system
3. Set up monitoring/alerting
4. Create data synchronization tools
5. Build migration utilities

**Nginx routing strategy**:

```nginx
# Route based on feature flags or user preferences
location / {
    if ($cookie_app_version = "v2") {
        proxy_pass http://localhost:4000;
    }
    proxy_pass http://localhost:3000;
}
```

**Success Criteria**:

- [ ] Routing infrastructure:
  - [ ] Nginx config tested and deployed
  - [ ] Version switching via cookie works
  - [ ] Both versions accessible simultaneously
  - [ ] No routing conflicts
- [ ] Feature flags:
  - [ ] Flag system implemented
  - [ ] Flags control feature availability
  - [ ] Admin UI for flag management
- [ ] Data consistency:
  - [ ] Shared data accessible by both versions
  - [ ] Session management works across versions
  - [ ] No data corruption during switches
- [ ] Monitoring:
  - [ ] Metrics collected for both versions
  - [ ] Alerts configured for failures
  - [ ] Performance dashboards available
- [ ] Scripts working:
  - [ ] `npm run dev` starts both versions
  - [ ] `scripts/start-v1.sh` works
  - [ ] `scripts/start-v2.sh` works
  - [ ] `scripts/start-all.sh` works
  - [ ] `scripts/migrate-data.js` tested

### Phase 5: Gradual Migration

**Goal**: Safely transition users to v2

1. Enable v2 for internal testing
2. Beta program for willing users
3. Gradual rollout by percentage
4. Monitor metrics and feedback
5. Full migration when stable

**Rollback procedures**:

- Cookie-based version switching
- Data compatibility layer
- Quick reversion capability

**Success Criteria**:

- [ ] Internal testing phase:
  - [ ] Team using v2 for daily work
  - [ ] All blocking issues resolved
  - [ ] Performance acceptable
- [ ] Beta program:
  - [ ] Beta users identified and onboarded
  - [ ] Feedback collection system working
  - [ ] Issues tracked and prioritized
  - [ ] Beta users satisfied with v2
- [ ] Gradual rollout:
  - [ ] 10% → 25% → 50% → 100% milestones
  - [ ] Rollback tested at each stage
  - [ ] No increase in error rates
  - [ ] No increase in support tickets
- [ ] Migration completion:
  - [ ] 100% users successfully on v2
  - [ ] Performance metrics positive
  - [ ] V1 traffic approaching zero
  - [ ] Team consensus to deprecate v1
- [ ] Final verification:
  - [ ] All npm scripts still working
  - [ ] Documentation fully updated
  - [ ] V1 removal plan approved

## Shared Resources Strategy

### Data Sharing

```
shared/
├── data/          # SQLite databases, JSON files
├── sessions/      # User session files
└── config/        # Shared configuration
```

Both v1 and v2 access the same data directories, ensuring:

- User sessions persist across versions
- Data changes are immediately visible
- No synchronization needed

### Configuration Sharing

- Environment variables loaded by both versions
- Shared secrets and API keys
- Feature flags accessible to both

## Migration Scripts

### Root-level utilities

- `scripts/start-v1.sh` - Start v1 application
- `scripts/start-v2.sh` - Start v2 application
- `scripts/start-all.sh` - Start both versions
- `scripts/migrate-data.js` - Data transformation utilities

## Risks and Mitigation

| Risk                   | Impact | Mitigation                    |
| ---------------------- | ------ | ----------------------------- |
| Data corruption        | High   | Extensive testing, backups    |
| Performance regression | Medium | Benchmarking, gradual rollout |
| Feature mismatch       | Medium | E2E tests, feature flags      |
| User confusion         | Low    | Clear communication, training |

## Success Metrics

- **Performance**: V2 response times ≤ v1
- **Reliability**: 99.9% uptime maintained
- **User Satisfaction**: No increase in support tickets
- **Developer Velocity**: 20% faster feature development
- **Build Times**: 50% faster with caching

## Timeline

This migration follows agent-based phases rather than fixed timelines:

- Phases can execute in parallel where possible
- Each phase completes when success criteria are met
- No artificial deadlines that compromise quality

## Post-Migration Cleanup

Once v2 is stable and v1 is deprecated:

1. Remove `apps/v1/` directory
2. Remove v1-specific scripts
3. Simplify nginx configuration
4. Archive this migration document
5. Update documentation to reflect v2-only
