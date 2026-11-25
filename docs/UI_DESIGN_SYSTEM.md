# Crowne ORMS UI Design System

## 1. Brand direction

The UI should feel like a modern, dependable recruitment platform while retaining Crowne's recognizable royal-blue and gold identity.

The supplied Crowne logo image is a low-resolution reference. The prototype uses a simplified temporary crown mark; it is not an approved replacement for the corporate logo. Do not redraw or alter the official logo without client approval.

## 2. Working color tokens

These are working values sampled/derived from the supplied logo and prototype direction. Confirm exact production values with Crowne before final brand sign-off.

```css
:root {
  --crowne-royal: #141E68;
  --crowne-royal-hover: #202F85;
  --crowne-royal-soft: #EDF1FF;
  --crowne-gold: #F4CF36;
  --crowne-gold-soft: #FFF7D6;

  --background: #F6F7FB;
  --surface: #FFFFFF;
  --text-primary: #1C2540;
  --text-secondary: #75809A;
  --border: #E7EAF1;

  --success: #16845B;
  --success-soft: #E8F6EF;
  --warning: #9A6900;
  --warning-soft: #FFF5D9;
  --danger: #BD4141;
  --danger-soft: #FFF0EF;
}
```

## 3. Color usage

- Royal blue: primary navigation, primary buttons, links, selected states, important brand elements.
- Gold: small highlights, featured actions, accent details. Do not use gold for long body text or large dense surfaces.
- White/light neutral: primary content surfaces, forms, cards, tables.
- Semantic colors: success, warning, danger, informational states. Do not repurpose gold as a warning status if it creates ambiguity with brand accents.

## 4. Typography

- Use the project's approved sans-serif UI font (system stack is acceptable initially; Inter may be selected if bundled/approved).
- Clear hierarchy: page title, section title, card title, helper text.
- Prefer readable body sizes. Do not make tables or forms excessively tiny to fit more content.
- Use tabular numerals for amounts, IDs, and metrics where useful.

## 5. Layout patterns

### Agency workspace
- Fixed/collapsible left navigation on desktop.
- Top bar with breadcrumb, notifications, and user menu.
- Consistent page heading with concise description and primary action.
- KPI cards only where they add decision value.
- Tables for structured operational records; filters/search above tables.
- Kanban for recruitment pipeline when it improves stage management.
- Detail pages should group related information into clear sections/tabs.

### Applicant portal
- Public site has a simpler top navigation and clear job-search entry point.
- Job cards prioritize job title, employer, destination, vacancies, and approved compensation details.
- Job detail page separates qualifications, responsibilities, terms, and application action.
- Applicant portal navigation should be simple and understandable on mobile.
- Make application progress and required next actions easy to find.
- Use plain language; avoid internal agency terminology where possible.

## 6. Interaction patterns

- Primary button: one clear primary action per view where possible.
- Secondary actions: neutral outline/ghost buttons.
- Use dialogs for focused confirmations and short tasks, not as a substitute for complex pages.
- Tables: loading skeleton, empty state, error state, pagination, and responsive overflow.
- Forms: labels, help text, validation, disabled/loading submit states, success/error feedback.
- Status: always show a text label, not color alone.
- Destructive actions: confirmation and clear consequence.
- Avoid decorative charts that do not support an operational decision.

## 7. Design consistency

- Use shadcn/ui primitives with consistent variants.
- Define reusable Tailwind theme tokens rather than repeating arbitrary colors.
- Keep spacing, radius, shadows, and typography consistent.
- Do not introduce a second unrelated design language between admin and applicant surfaces.
- Applicant pages may be warmer/more welcoming; internal admin pages may be denser, but both share Crowne colors and components.

## 8. Prototype caveat

The HTML prototypes are references for layout and interaction intent only. They contain illustrative data and simplified interactions. They are not a source of truth for actual business requirements, legal copy, salary claims, or final brand assets.
