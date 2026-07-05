The action control; labels are one or two plain human words with the consequence as helper text, and only one ember `primary` per screen.

```jsx
<Button variant="primary" helper="Opens the PR · nothing ships without you">Approve</Button>
<Button variant="secondary">Send back</Button>
<Button variant="quiet">Not now</Button>
```

Variants: `primary` (ember fill, dark ink), `secondary` (hover surface + hairline), `quiet` (text only). Sizes: `md`, `sm`. Never put mechanism names ("Run dispatch", model names) on a button.
