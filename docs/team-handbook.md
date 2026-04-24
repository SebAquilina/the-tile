# Team handbook — The Tile website

For the showroom team. Everything you need to run the website day-to-day without needing a developer.

## What the website does for you

1. **Answers common customer questions 24/7** through the concierge on the home page. Most enquiries that used to come as "can I get a sample?" or "what suits a small bathroom?" now get a useful first answer before the customer reaches you.
2. **Shortlists tiles for customers** through the save-list. When an enquiry arrives with a shortlist attached, you already know what they like before you pick up the phone.
3. **Sends every enquiry into your inbox** as a plain email. Reply to it like any other mail.

## The five things you will actually do

### 1. Reply to enquiries

They arrive in the shop inbox with subject `New enquiry — [name]`. Hit reply, answer normally. The customer's email, phone (if provided), and shortlist come in the body of the email.

### 2. Mark a tile as out of stock (or back in stock)

Go to https://the-tile.com/admin, sign in, click Products, find the tile, flip the **In stock** switch, hit Save. The public site catches up within a couple of minutes.

### 3. Check this week's enquiries and activity

Admin → Leads shows every enquiry, newest first. Admin home shows counts and quick links.

### 4. Add a new tile series

Two options, same result:

- **Easier (recommended)**: email the dev team with the supplier catalogue and we will add it the same day.
- **DIY**: follow `docs/runbook/seed-update.md` — one JSON file, browser editor on GitHub, three-minute wait.

### 5. Update the journal

Short articles under `/journal`. Open an issue on GitHub with the draft copy; we will publish it. Phase 3: self-service publishing directly from the admin UI.

## Concierge — what it can and can't do

The concierge is a language model grounded in your catalogue. It:

- Knows all 60 series we carry, their effects, and the brands.
- Knows general Malta-relevant tile advice (humidity, sun, slip ratings for outdoor paving).
- Recommends three or four tiles in response to a prompt.
- Filters the catalogue and navigates the customer through the site.
- Captures a lead when the customer is ready, and sends you a standard enquiry email.

It will not:

- Invent tile names or brands. If the customer asks about something we don't carry, it says so.
- Quote a price. Prices come from the showroom.
- Book a showroom visit by itself — Phase 2 adds Cal.com; for now it prompts the customer to fill the contact form.

## If something feels wrong

- Something the concierge said is factually wrong about a tile we sell — flag it on the admin → concierge feedback (Phase 2), or drop a note to the dev team.
- The site is slow or broken — check https://the-tile.com/api/health in a browser. If you see `{"ok":true,...}` the site is up and the problem may be local; try a different device. If that fails too, email the dev team.
- An enquiry never arrived — check the shop inbox spam folder first, then admin → Leads to confirm it was actually submitted.

## Security

- The admin URL is `https://the-tile.com/admin`. Keep the password in 1Password. Do not share in email or SMS.
- If anyone leaves the team who had admin access, rotate the password the same day (dev team can help).

## Who to contact

- **Dev team** (website bugs, new features, training): same email the original pitch came from.
- **Cloudflare account owner**: The Tile. We have admin access but the account is yours.
- **Domain registrar**: The Tile. Same as before.
- **Supplier contacts**: unchanged — the website does not touch supplier systems.
