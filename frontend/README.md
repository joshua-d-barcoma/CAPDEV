# BenchFlow

BenchFlow is a React single-page application for bench resource management. The UI is a demo application and persists its sample data in browser storage; it does not connect to a production backend.

## Requirements

- Node.js 18.18 or later
- npm 9 or later

## Development

```bash
npm install
npm run dev
```

Vite prints the local development URL after startup.

## Production build

```bash
npm run build
npm run preview
```

The optimized static build is written to `dist/`.

## Tests

```bash
npm test
```

## Source organization

```text
src/
├── api/          # Shared HTTP client and API configuration
├── components/   # Reusable UI, forms, dialogs, tables, and application shell
├── constants/    # Route paths, navigation, and stable app values
├── hooks/        # Shared state and reusable business logic
├── pages/        # Route-level page composition
├── routes/       # Central route configuration and route rendering
├── services/     # Data access and business operations
├── utils/        # Formatting and validation helpers
├── App.jsx       # Application composition
├── main.jsx      # React entry point
└── index.css     # Global design system and shared component styles
```

Pages compose reusable components and call shared hooks; API and browser-storage access stay in `services/` and `api/`, never in presentation components. Route-level pages are lazy-loaded.

## Demo data and backend integration

The current application has no backend API. `services/benchDataService.js` seeds and persists demo data in `localStorage`, keeping the existing prototype useful without pretending a remote API exists. The configurable fetch client is in `api/httpClient.js`. When an API becomes available, configure `VITE_API_BASE_URL` and replace the relevant service implementations; component and page contracts can remain unchanged.

Clear the `bench-flow:` keys from browser storage to restore the initial demo data.

## Shared create/edit form

The employee directory uses one `EmployeeForm` for both creation and editing. The same fields, constraints, and layout are used in both modes; only the dialog title, submit label, and submit handler vary.

## Employee imports

From **Employees**, choose **Import** to upload a CSV or `.xlsx` workbook and review the records before applying them. The review keeps existing matching employees unchanged and adds only new records. **History** opens saved import snapshots, with pagination for large files. A 20-employee CSV sample is available at `public/sample-employee-import-actions.csv`.
