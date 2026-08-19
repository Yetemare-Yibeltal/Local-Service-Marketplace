LOCAL SERVICE PROVIDER MARKETPLACE

SOFTWARE PROJECT SPECIFICATION

Version 1.0.0

Date: August 2026

Status: Approved

Prepared For: Development Team and Stakeholders

Prepared By: Software Architecture Division

TABLE OF CONTENTS

Introduction

Problem Analysis

Impact Assessment

Competitive Landscape

Proposed Solution

Target Users and User Roles

Functional Requirements

Non-Functional Requirements

Assumptions and Constraints

Risk Assessment

Success Metrics

Technology Stack

System Architecture

Development Roadmap

Deployment Strategy

Conclusion

Appendices

INTRODUCTION

1.1 Purpose of This Document

This document serves as the complete software project specification for the Local Service Provider Marketplace platform. It defines the scope, requirements, architecture, and development roadmap for the entire project. This specification serves as the definitive reference for all design, development, testing, and deployment activities.

1.2 Project Background

The rapid urbanization of Ethiopian cities has created a high density of residents requiring frequent home maintenance and professional services. Simultaneously, a large workforce of skilled technicians operates within the informal economy without structured access to customers. The disconnect between service demand and supply results in inefficiencies, distrust, and financial losses on both sides. This project aims to bridge that gap using a digital marketplace approach.

1.3 Scope

The platform is defined as a two-sided digital marketplace connecting customers with local service professionals. The professionals include plumbers, electricians, tutors, cleaners, mechanics, photographers, carpenters, and painters. The system provides user registration, provider onboarding and verification, geo-location based service discovery, structured booking management, status tracking, and post-service reviews. The initial deployment targets Addis Ababa with a mobile-first web application.

1.4 Definitions

Customer: An individual seeking to hire a service professional.

Provider: An individual offering professional services.

Admin: A system operator responsible for maintaining platform integrity.

Booking: A formal agreement between a customer and a provider for a service at a specific time.

MVP: Minimum Viable Product, the first functional release.

OTP: One-Time Password, used for phone verification.

JWT: JSON Web Token, used for secure API authentication.

PROBLEM ANALYSIS

2.1 The Core Problem

Urban residents in Ethiopian cities lack a centralized, trusted, and efficient digital platform to discover, compare, verify, and book local service professionals based on real-time availability, location proximity, transparent pricing, and peer reviews.

2.2 Root Causes

The population of Addis Ababa has grown exponentially over the past decade. This concentration creates a high volume of daily service requests that the informal infrastructure cannot handle efficiently. The service industry is highly fragmented with professionals operating independently without digital footprints. Ethiopian society traditionally relies on word-of-mouth recommendations which limits options to immediate social circles. While most professionals own smartphones, they lack structured business tools for scheduling, pricing, and reputation management. The informal market lacks systems to track reliability, quality of work, or safety records.

2.3 Who Experiences This Problem

Urban homeowners and renters need urgent repairs for plumbing, electrical faults, and appliance maintenance. Business operators require immediate maintenance to avoid operational downtime and revenue loss. The expatriate and international community lacks local networks and struggles to find safe, reliable, and English-speaking providers. Students need tutors, translators, and document processing services. Time-constrained professionals earning hourly wages cannot afford to take entire days off to physically search for technicians.

IMPACT ASSESSMENT

3.1 Financial Impact

Households typically overpay by an estimated 20 to 40 percent above fair market rates during emergency situations due to lack of price comparison tools. A single day of downtime for a restaurant due to a broken refrigerator can result in spoiled inventory valued between 5,000 and 20,000 Ethiopian Birr. Customers pay transportation fees for multiple professionals to visit and provide quotes without guarantee of work.

3.2 Time Impact

The average time spent finding a reliable electrician in Addis Ababa ranges from three to seven hours using manual methods. Customers waste four or more hours waiting for providers who confirm appointments but never arrive. Professionals often fail to bring required parts, forcing customers to spend an additional one to three hours traveling to purchase them.

3.3 Productivity Impact

Office managers spend entire mornings managing maintenance issues instead of performing core duties. Remote workers lose full days of focused work time due to unresolved household maintenance issues. Professionals spend excessive time traveling and negotiating instead of performing billable work, reducing their overall income.

3.4 Security and Safety Impact

Allowing unvetted strangers into private homes poses a significant risk of theft and personal harm. Professionals may gain access to sensitive documents during home visits. Individuals living alone, particularly women, face heightened vulnerability when hiring technicians for after-hours emergency repairs.

3.5 Manual Process Limitations

The current manual process involves asking friends and family, searching Facebook groups, physically walking to local workshop areas, and calling random numbers from street posters. This approach offers no historical tracking of provider performance, no cancellation policies, no automated reminders, no conflict resolution mechanisms, and no system to blacklist unreliable providers.

COMPETITIVE LANDSCAPE

4.1 Existing Solutions

Social media platforms such as Facebook and Telegram lack structured search, rating systems, and availability tracking. Content is highly cluttered and scam accounts are prevalent.

GoodayOn focuses on daily home services including cleaning and cooking. Its limitations include a restricted web interface, reliance on high-end smartphones, and limited category coverage.

Sira operates primarily in Addis Ababa with limited category coverage and lacks robust provider verification processes.

Qefira and 2Merkato are generalist classifieds platforms covering vehicles, real estate, and household items. They lack specialization in services and offer poor search functionality for professional skills.

Traditional Delalas charge commissions for connecting customers with providers. They operate inefficiently, have limited geographic reach, and maintain unprofessional standards.

4.2 Gap Analysis

There is a clear gap in the market for a centralized web-based platform that combines structured search, geo-location, verification, booking management, and review capabilities. Most existing solutions address only one or two of these dimensions. The proposed system aims to fill this gap by integrating all essential features into a single unified experience.

PROPOSED SOLUTION

5.1 System Overview

The Local Service Provider Marketplace is a web-based platform that connects customers with verified service professionals. It centralizes discovery, comparison, booking, and review processes to reduce friction and build trust.

5.2 How the System Solves the Problem

All providers are listed in a structured directory allowing customers to find relevant professionals within seconds rather than hours. Providers are required to submit identification documents which administrators review and verify. Providers list fixed and hourly rates upfront, eliminating price negotiation. Using map integration, customers search for providers within a defined radius. A strict booking state machine manages statuses through pending, confirmed, in-progress, completed, and cancelled states. Post-job reviews create accountability.

5.3 Problems Fully Solved

Discovery time reduces to under two minutes through structured search and filtering. Price transparency becomes standard with upfront service listings. Provider identity is verified through document review. Booking status is tracked automatically keeping both parties informed. Historical performance data is preserved through persistent reviews.

5.4 Problems Partially Solved

Quality assurance remains partially addressed as reviews cannot immediately fix a completed poor job. On-time arrival is improved through tracking and penalties but cannot be absolutely guaranteed for first-time bookings. Payment security is limited to offline cash handling initially.

5.5 Future Enhancements

In-app payments through Telebirr and Chapa with escrow functionality are planned for Phase 2. On-time guarantees with partial refunds for late arrivals will be implemented in Phase 3. Insurance partnerships for property damage coverage will be explored in Phase 4. AI-driven scheduling optimization to minimize provider travel gaps is planned for Phase 5.

TARGET USERS AND USER ROLES

6.1 Primary Users

Ethiopian residents aged 25 to 50 with middle to upper income levels, reliable internet access, and residence in urban centers form the primary customer base.

6.2 Secondary Users

Expatriates, international organizations, and non-governmental organizations operating in Ethiopia represent secondary users requiring reliable access to professional services.

6.3 Tertiary Users

Small business owners needing regular maintenance and repair services constitute the tertiary user group.

6.4 User Roles

Customer Role

The customer is responsible for registering an account, searching for providers, filtering results based on preferences, viewing provider profiles, creating bookings, completing offline payments, and leaving reviews after job completion.

Provider Role

The provider is responsible for registering a business profile, listing service offerings, setting availability schedules, managing incoming booking requests, accepting or rejecting bookings, and viewing earnings summaries.

Administrator Role

The administrator is responsible for managing user accounts, reviewing and approving verification requests, resolving disputes, managing service categories, and accessing system analytics.

FUNCTIONAL REQUIREMENTS

FR-01: User Registration

The system shall allow individuals to register using their email address and phone number with one-time password verification.

FR-02: Provider Onboarding

The system shall allow registered users to apply for provider status including business name, category, location, pricing, and portfolio images.

FR-03: Provider Verification

The system shall allow administrators to approve or reject verification requests based on submitted identification documents.

FR-04: Geo-Location Search

The system shall support searching for providers based on location with user-defined radius.

FR-05: Advanced Search Filters

The system shall allow filtering by category, minimum rating, price range, and availability status.

FR-06: Booking Creation

The system shall allow customers to book a provider for a specific date and time with address and instructions.

FR-07: Booking State Management

The system shall enforce a strict booking state machine with pending, confirmed, in-progress, completed, cancelled, and disputed statuses.

FR-08: Automated Notifications

The system shall send automated email and SMS reminders 24 hours and 1 hour before scheduled bookings.

FR-09: Review and Rating

The system shall allow customers to leave a review with rating, text, and optional images after completion.

FR-10: Provider Dashboard

The system shall provide a dashboard displaying pending requests, upcoming jobs, completed jobs, and earnings.

FR-11: Customer Dashboard

The system shall provide a dashboard displaying upcoming bookings, past bookings, and saved providers.

FR-12: Admin Panel

The system shall provide an administrative panel for user management, verification queue, dispute resolution, and category management.

FR-13: Category Management

The system shall allow administrators to create, update, and deactivate service categories.

FR-14: Audit Logging

The system shall log all significant actions including login attempts, booking status changes, and verification decisions.

NON-FUNCTIONAL REQUIREMENTS

NFR-01: Performance

Search results shall render within 1.5 seconds. Booking state transitions shall complete in under 500 milliseconds.

NFR-02: Availability

The system shall maintain uptime of 99.5 percent.

NFR-03: Usability

The interface shall be mobile-first and fully functional on screens as small as 4.7 inches.

NFR-04: Scalability

The system shall support 1,000 concurrent users at launch.

NFR-05: Security

All passwords shall be hashed using bcrypt. All API endpoints except registration and login shall require JWT authentication.

NFR-06: Data Integrity

The database shall enforce referential integrity through foreign key constraints.

NFR-07: Maintainability

The backend shall follow modular MVC architecture. The frontend shall use component-driven design.

NFR-08: Browser Compatibility

The application shall be compatible with the latest two versions of Chrome, Firefox, and Safari.

NFR-09: Offline Resilience

The application shall implement service workers to provide basic functionality during connectivity interruptions.

NFR-10: Localization

The interface shall support both English and Amharic languages with a seamless toggle.

NFR-11: Accessibility

The application shall comply with WCAG 2.1 Level AA standards.

NFR-12: Documentation

All API endpoints shall be documented using OpenAPI specification version 3.0.

ASSUMPTIONS AND CONSTRAINTS

9.1 Assumptions

Users possess basic smartphones with internet connectivity at 3G or 4G speeds. Providers possess national identification cards for verification. Digital payment platforms will become accessible via API in future phases. The target audience is comfortable using a web application with Amharic and English interfaces. Personal data will be handled in accordance with applicable privacy principles.

9.2 Constraints

The project is limited to free-tier or low-cost cloud services. The platform cannot process financial transactions without proper licensing. Payments must remain offline or through third-party aggregators until licensing is secured. Ethiopia experiences intermittent power and internet connectivity requiring offline-first design. The MVP must be developed within eight weeks. The initial development team consists of a single full-stack developer.

RISK ASSESSMENT

10.1 Risk: Provider No-Shows

Impact is high and causes user churn. Mitigation involves implementing a provider penalty system with suspension after three verified no-shows, sending automated confirmation reminders, and allowing customers to cancel without penalty if provider is more than 30 minutes late.

10.2 Risk: Fake Reviews

Impact is medium. Mitigation restricts review submission to customers who have a completed booking with that provider. Sentiment analysis flags suspicious review patterns for admin review.

10.3 Risk: Scam and Identity Theft

Impact is high. Mitigation mandates ID upload for all providers with manual administrative review before awarding verification badges.

10.4 Risk: Server Downtime

Impact is medium. Mitigation involves deploying on reliable cloud infrastructure with automatic restart policies, health checks, monitoring alerts, and regular backups.

10.5 Risk: Low User Adoption

Impact is high. Mitigation focuses early marketing on a specific geographic area such as Bole district to achieve density. Promotional incentives are offered for early provider registrations.

10.6 Risk: Data Breach

Impact is critical. Mitigation encrypts all sensitive data at rest and in transit. Regular security audits are conducted. Strict role-based access control is enforced.

10.7 Risk: Scope Creep

Impact is medium. Mitigation strictly adheres to the defined MVP feature set. All future enhancements are deferred to subsequent phases.

SUCCESS METRICS

11.1 Business Goals

Achieve 100 active providers and 500 registered customers within three months of soft launch. Facilitate 200 successful booking completions per month. Establish brand recognition as the trusted marketplace for home services in Addis Ababa.

11.2 Technical Goals

Produce a robust RESTful API with OpenAPI documentation. Achieve 90 percent unit test coverage for the booking state machine. Score above 90 for Performance, Accessibility, and Best Practices in Lighthouse audits. Implement CI/CD pipeline using GitHub Actions.

11.3 Key Performance Indicators

Customer Acquisition: 500 registered customers within 90 days.

Provider Onboarding: 100 verified providers across six core categories including Plumbing, Electrical, Cleaning, Tutoring, Photography, and Mechanics.

Booking Completion Rate: 85 percent or higher.

Average Provider Rating: Above 4.0 out of 5.0 stars.

Provider Response Time: Under two hours.

Customer Retention: 30 percent return for a second booking within 30 days.

Monthly Active Users: 300 monthly active customers by month three.

TECHNOLOGY STACK

12.1 Frontend

Next.js 14 with TypeScript is selected for the frontend. This framework provides server-side rendering for improved SEO and performance. The App Router enables efficient routing and code organization. Tailwind CSS is chosen for styling due to its utility-first approach and rapid development capabilities. The combination ensures a mobile-first responsive interface that works across all devices.

12.2 Backend

Node.js with Express is selected for the backend. Node.js offers non-blocking I/O suitable for handling concurrent API requests. Express provides a minimalist and flexible framework with extensive middleware support. TypeScript is used throughout for type safety. This stack enables rapid development with high performance.

12.3 Database

PostgreSQL is selected as the primary database. It provides ACID compliance essential for transactional booking data. Its support for JSON operations and spatial queries via PostGIS is valuable for geo-location search. Prisma is chosen as the ORM for type-safe database access, automatic migrations, and simplified query building.

12.4 Cache

Redis is selected for session storage and query caching. It provides in-memory performance, supports expiration policies, and reduces database load for frequent search queries.

12.5 Authentication

JWT is used for stateless authentication. Bcrypt is used for password hashing due to its adaptive cost factor and resistance to brute force attacks. Refresh tokens enable long-term session management without compromising security.

12.6 File Storage

Cloudinary is selected for image uploads and optimization. It provides automatic image resizing, format conversion, and CDN delivery. The free tier is sufficient for MVP.

12.7 Mapping

Mapbox is selected for geo-location services. It offers comprehensive mapping APIs, search autocomplete, and customizable map styles. The free tier provides ample usage for MVP.

12.8 Notifications

Nodemailer is used for email notifications. Twilio is used for SMS notifications. Both provide reliable delivery with free tier options.

12.9 Deployment

Vercel is selected for frontend deployment. Railway is selected for backend deployment. Both offer free tiers, automatic SSL, and seamless integration with GitHub. Docker is used for containerization to ensure consistent environments.

12.10 CI/CD

GitHub Actions is selected for continuous integration and deployment. It provides automated testing on pull requests and automated deployment on merges to the main branch.

SYSTEM ARCHITECTURE

13.1 High-Level Architecture

The system follows a three-tier architecture. The presentation tier consists of the Next.js frontend application serving the user interface. The application tier consists of the Express backend API handling business logic. The data tier consists of PostgreSQL for persistent storage and Redis for caching. All tiers are containerized using Docker for consistent deployment.

13.2 API Design

The backend provides RESTful API endpoints organized by resource. Authentication endpoints handle registration, login, and token refresh. Provider endpoints manage profiles, services, and availability. Search endpoints handle geo-location queries. Booking endpoints manage creation, status updates, and dashboard data. Review endpoints handle submissions. Admin endpoints manage verification, disputes, and categories.

13.3 Authentication Flow

Users register with email and phone. OTP is sent via SMS for verification. Users login with credentials and receive access and refresh tokens. Access tokens expire in 15 minutes. Refresh tokens expire in 7 days. Protected endpoints validate JWT and enforce role-based access.

13.4 Booking State Machine

The booking state machine enforces strict transitions. Pending status can transition to Confirmed, Cancelled, or Disputed. Confirmed can transition to InProgress, Cancelled, or Disputed. InProgress can transition to Completed or Disputed. Completed is terminal. Cancelled is terminal. Disputed is terminal requiring admin intervention.

13.5 Notification Flow

Notifications are triggered by system events. Registration triggers email verification. OTP triggers SMS. Booking creation triggers confirmation emails to both parties. 24 hours before scheduled time triggers reminder emails. 1 hour before scheduled time triggers reminder SMS. Status changes trigger status update emails.

DEVELOPMENT ROADMAP

Phase 1: System Analysis

This phase delivered the complete requirements specification. All functional and non-functional requirements are documented. User roles, risks, and success criteria are defined. This phase is closed and requires no further action.

Phase 2: Project Planning

This phase establishes the complete development roadmap. All subsequent phases are defined with clear deliverables and timelines. Dependencies between phases are identified.

Phase 3: Technology Selection

This phase defines the complete technology stack for the project. Every technology is evaluated for performance, scalability, maintainability, security, cost, and long-term support.

Phase 4: Project Structure and Setup

This phase creates the complete project folder structure and all necessary configuration files. The frontend, backend, shared, docs, and scripts directories are created. Environment files and Docker configuration are prepared.

Phase 5: Database Design

This phase produces the complete database schema. All tables, relationships, indexes, and constraints are defined. Prisma schema is written and migrations are applied to the development database.

Phase 6: Backend Development

This phase implements the authentication system, JWT middleware, user management, provider registration, search, booking management, reviews, notifications, admin functions, and analytics. The booking state machine logic is implemented and unit tested.

Phase 7: Frontend Development

This phase implements all user-facing pages in parallel with backend development. Landing page, search results, provider profile, booking flow, customer dashboard, provider dashboard, and admin panel are built.

Phase 8: Feature Integration

This phase integrates file uploads, map services, email notifications, SMS notifications, and localization. All secondary features are connected to the backend.

Phase 9: Performance Optimization

This phase optimizes database queries with indexing, implements Redis caching, enables pagination, compresses assets, implements lazy loading, and runs Lighthouse audits.

Phase 10: Security Hardening

This phase implements rate limiting, input validation, XSS protection, CSRF protection, secure headers, and audit logging. Security audit of dependencies is performed.

Phase 11: Testing and Quality Assurance

This phase executes all unit tests, integration tests, and end-to-end tests. User acceptance testing is performed. All identified issues are fixed and retested.

Phase 12: Documentation

This phase generates README, installation guide, deployment guide, API documentation, user guides, and administrator guide.

Phase 13: Deployment

This phase deploys the backend to Railway, frontend to Vercel, configures SSL certificates, sets up monitoring, and verifies all functionality in production.

Phase 14: Maintenance and Handover

This phase monitors the system for 7 days post-launch, addresses critical issues, performs database backups, collects feedback, and hands over documentation.

DEPLOYMENT STRATEGY

15.1 Environment Configuration

Three environments are defined. Development is for local coding. Staging mirrors production for testing. Production is the live system. Each environment has separate environment variables and database instances.

15.2 Deployment Process

Code is pushed to GitHub. GitHub Actions runs tests on pull requests. On merge to the main branch, the staging environment is automatically deployed. After staging validation, manual promotion deploys to production. Rollback is supported by redeploying previous versions.

15.3 Infrastructure

The backend is deployed on Railway with PostgreSQL and Redis. The frontend is deployed on Vercel. Both platforms provide SSL certificates, automatic scaling, and health monitoring. Docker containers ensure consistency across environments.

15.4 Monitoring

Health checks are implemented on all critical endpoints. Sentry is used for error tracking. Application performance monitoring is configured to track response times and error rates. Database monitoring tracks connection pools and query performance.

CONCLUSION

The Local Service Provider Marketplace project addresses a genuine and pressing need in the Ethiopian urban landscape. The problem is well-defined, the impact is measurable, and the proposed solution is technically feasible within the given constraints. The system will deliver tangible value to customers by saving time and money, and to providers by increasing their visibility and income. By following the structured phases outlined in this document, the development team can deliver a production-ready platform within the stipulated timeline.

APPENDICES

Appendix A: Glossary of Terms

A complete glossary of technical and business terms is maintained in the project repository.

Appendix B: Stakeholder Sign-off

This document is subject to review and approval by project stakeholders.

Appendix C: Revision History

Version 1.0.0: Initial release. August 2026.

Appendix D: References

Reference materials including market research data and technical documentation are available in the project repository.