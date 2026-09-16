# Tuto — Product Requirements Document

**Version 0.2 | Pre-seed, build-ready | Revised after structured review**

This version applies every correction agreed in the v0.1 review. Twenty three lapses were found and all twenty three are fixed here. The changes that matter most: the past-question rights question is now a gate before any code, the free tier quiz cap is removed because it made the north star arithmetically unreachable, the inference cost figure is corrected by a factor of thirty, a go-to-market section has been added, the verification service that the accuracy claim depends on is now a named component with its own budget, and the Prisma schema compiles.

> *Scope note, read this first. v1 means the Phase 2 exit state described in section 14. Every "Must" marker in section 5 refers to that state. The Atlas layer is fully specified in Appendix A and does not ship in v1. Any price shown for an Atlas tier is indicative and is not committed until the Phase 2 signal test returns.*

## 1. Product Summary

Tuto is a web application that turns a photographed exam question into a short guided lesson. A student in JSS1 to SS3 uploads a picture of a maths, science, English or history question and Tuto walks them through it in five steps: what the question is actually asking, the worked solution, why the method works, a follow-up prompt, and a short quiz. Every question is mapped to a WAEC, NECO or JAMB syllabus topic, so the student always knows where the work sits in their exam.

Tuto exists because Nigerian students preparing for these exams have access to plenty of global AI answer engines and almost no tools that know their syllabus, their past questions, their marking schemes or their budget.

v1 ships two tiers: a free tier and Tuto Plus. The Atlas visual layer is specified in Appendix A, tested with three hand-built worlds in Phase 2, and built only if that test returns a signal.

Three taglines, in order of preference:

1.  Know it, not just answer it.

2.  Your syllabus, explained.

3.  From stuck to sure.

## 2. Problem Statement

A Nigerian secondary student sits three exams that decide their future: WAEC or NECO at the end of SS3, and JAMB UTME for university admission. Each is syllabus-bound and heavily patterned. Past questions repeat in structure year after year, and marking schemes reward specific method steps, not just correct final answers. Preparation is therefore less about general subject mastery and more about pattern fluency inside a defined syllabus.

### 2.1 Two student behaviours, not one

The review forced this distinction into the open, because the original draft described only the flattering half of the market.

| **Behaviour type** | **What they want at 10pm**                                       | **Assumed share** | **What Tuto must do**                                                                    |
|--------------------|------------------------------------------------------------------|-------------------|------------------------------------------------------------------------------------------|
| The checker        | To know whether their attempt was right, and where it went wrong | 30 percent        | Reward the attempt. Address their specific error. This is the differentiated experience. |
| The answer-seeker  | The answer, so they can finish and sleep                         | 70 percent        | Get out of the way in one tap, then make the explanation short enough to read anyway.    |

\[ASSUMPTION A1\] The 30/70 split is a first guess with no basis. It is tested in Phase 1 week one by fifty student conversations. If the answer-seeker share is above 85 percent, the explanation-first positioning is weaker than this document assumes and the loop completion target in section 3 must come down.

### 2.2 How students cope today

In rough order of frequency: copy from a classmate, buy a past-question booklet from a vendor outside the school gate and read the answers without the working, ask a teacher who has forty other students in the room, pay for after-school lesson if the family can afford it, or paste the question into ChatGPT or Gauth on a shared phone.

\[ASSUMPTION A1b\] This ordering is from general market knowledge, not primary research. Same test, same week, same owner as A1.

### 2.3 Why the existing tools fail here

They do not know the syllabus. Gauth, Photomath and Socratic will solve a quadratic, but they cannot tell a student that the question is a 2019 JAMB item on the sum and product of roots, that this topic appears in roughly one in four papers, or that the marking scheme awards a mark for stating the relationship before substituting. The answer arrives without context, so the student learns the answer and not the pattern.

They are priced for dollars. A monthly subscription at ten to fifteen dollars is not a considered purchase for most Nigerian families, it is a non-purchase.

They are heavy. Global edtech apps assume a fast connection and a device with headroom. A student on a shared low-end Android over 3G, watching a data bundle drain, abandons a page that takes nine seconds to paint.

They reward copying. Gauth puts the answer first and indexes solved questions publicly. That is fine for a student checking their work and corrosive for a student who has not attempted it. Schools notice, and school hostility is a real acquisition problem in a market where teachers and principals influence what parents pay for.

## 3. Goals and Non-Goals

> *Definition of v1. v1 is the Phase 2 exit state in section 14: the core solve loop, four subjects, two paid tiers, payments, parent link, and offline reading. All Must markers in section 5 refer to that state.*

### 3.1 Goals

Every target below is now marked as derived or first-guess. Three of them were invented in v0.1 and presented as though they had a basis. All of them now also appear in section 13.

| **\#** | **Goal**                                               | **Measure**                                                | **v1 target**                                                 | **Basis**                                                                      |
|--------|--------------------------------------------------------|------------------------------------------------------------|---------------------------------------------------------------|--------------------------------------------------------------------------------|
| G1     | Students complete the full loop, not just grab answers | Submitted quizzes divided by completed solutions           | 45 percent                                                    | First guess, no basis. Revise after Phase 1. Depends on A1.                    |
| G2     | Answers are trustworthy enough to build habit          | Accuracy on a 500-item past-question benchmark             | 95 percent maths and science, 90 percent English and history  | Derived. Below 95 percent, one wrong answer per twenty destroys word of mouth. |
| G3     | Usable on the target device and connection             | Time to first rendered step, throttled 3G, low-end Android | Under 14 seconds end to end, under 2.5 seconds to first paint | Derived from the stage budget in 6.4, which now includes upload.               |
| G4     | Parents convert and stay                               | Free to paid at 60 days, and 90-day retention on annual    | 4 percent conversion, 70 percent retention                    | First guess, no basis. Tested by the A2 price test in Phase 1.                 |
| G5     | Unit economics work before scale                       | Blended cost per solved question                           | Under 0.01 USD                                                | Derived from the stage costs in 6.1.                                           |

### 3.2 What these goals do not measure

Moved up from section 12 in v0.1, because it changes how the goals above should be read. None of these metrics measure learning. They measure engagement with a learning-shaped product. The only credible outcome evidence available at pre-seed is a small controlled study with one or two schools comparing a Tuto cohort against a control on a mock exam. That is budgeted in Phase 3, and it is worth more in a seed conversation than any engagement chart.

### 3.3 Non-goals

These are not in v1. Where a phase is named, that is when they are revisited.

- No native mobile app. A PWA covers install, offline reading and home screen presence at a fraction of the cost. Not revisited before Phase 4.

- No essay writing, no assignment solver, no document upload. This is Gauth territory, expensive to run, and the feature most likely to get Tuto banned by schools. Permanent non-goal.

- No human tutor marketplace. It is an operations business, not a software business. Permanent non-goal at pre-seed.

- No longitudinal mastery tracking or adaptive study plans in v1. Begins in Phase 3. This is the actual long-term moat and it is deferred only because it needs usage data that does not exist yet.

- No multi-question page processing, no handwriting beyond neat, no language other than English. Multi-question is Phase 3.

- No school or B2B sales motion. Schools are an influence channel in v1, not a revenue channel. Revisited after Phase 3 subject to Q5.

- No Atlas layer in v1. Specified in Appendix A, signal-tested in Phase 2, built in Phase 3 only on a positive signal. The argument is in section 14.

## 4. User Personas

### 4.1 Primary: Chidera, 16, SS2, Lagos state public school

She is preparing for WAEC next year and JAMB the year after. She studies between 8pm and 11pm, at the dining table, on her mother’s Infinix Hot phone which she is allowed to use after her mother finishes with it. Her data is a shared MTN bundle and she is aware of every megabyte. She has a past-question booklet for maths that she cannot fully use, because the answer key gives final answers with no working.

She reaches for Tuto when she is stuck. Sometimes she has attempted the question and wants to know where she went wrong. More often, per section 2.1, she just wants the answer. The product serves both without lecturing either.

She is not the payer. She will lobby for it if it works.

Her failure mode: she uses the free tier, hits the daily cap on a heavy study night, and does not come back.

### 4.2 Secondary: Mrs Adeyemi, 44, Chidera’s mother, civil servant

She already spends on lesson teachers, past-question booklets and school fees. She is not evaluating Tuto against other apps, she is evaluating it against two thousand naira of airtime or half a lesson session. She has a debit card but prefers transfer. She wants two things: proof her daughter is using it, and proof it is not helping her cheat.

She is the payer and she is the churner. The parent link (F1.5) and the weekly summary (F6.5) were marked optional in v0.1 while simultaneously being sold as a paid benefit in the tier table. Both are now Must. Her acquisition path is section 9, which did not exist in v0.1.

\[ASSUMPTION A11\] A third persona, the classroom teacher, matters as an influence channel but needs no product surface in v1. Low risk. Revisit if school partnerships become the growth path.

## 5. Functional Requirements

Must means v1, as defined in section 3, does not ship without it. Should means v1 ships better with it. Could means fast follow. There is no third scale. The Atlas requirements that carried a separate "Must for the Atlas release" marker in v0.1 have moved to Appendix A and carry no v1 priority.

### 5.1 Onboarding and authentication

| **\#** | **Requirement**                                                                                                                                                                        | **Priority** |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| F1.1   | A student can solve their first question before creating an account. Account creation is triggered at the second question.                                                             | Must         |
| F1.2   | Sign up by phone number with OTP, or by Google. No email and password as the primary path.                                                                                             | Must         |
| F1.3   | Onboarding captures class level (JSS1 to SS3) and target exam (WAEC, NECO, JAMB, none yet). Drives syllabus mapping. Cannot be skipped.                                                | Must         |
| F1.4   | A student under 13 is routed to a parental consent flow. The account is created but locked until a parent confirms by OTP on a separate number. See 7.6 for the honest limits of this. | Must         |
| F1.5   | A parent can link to a student account by code, giving read-only visibility of activity and control of billing. Promoted from Should: it is sold in the section 8 tier table.          | Must         |
| F1.6   | Sessions persist for 90 days on a device. On a shared device, an explicit switch-user control is visible, not buried.                                                                  | Must         |

### 5.2 Image capture and upload

| **\#** | **Requirement**                                                                                                                         | **Priority**   |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------|----------------|
| F2.1   | Capture from camera or upload from gallery, single image.                                                                               | Must           |
| F2.2   | Client-side crop with a guided frame plus auto-detect of the question block. The student confirms the crop before upload.               | Must           |
| F2.3   | Client-side downscale and compress to a maximum 1,600px long edge. Never upload the raw camera file.                                    | Must           |
| F2.4   | Pre-upload quality check on device: blur and brightness, with a retake prompt on failure. Saves a model call and the student’s data.    | Must           |
| F2.5   | Typed question entry as an alternative to image, including a basic maths keypad.                                                        | Should         |
| F2.6   | If the image contains more than one question, Tuto detects this and asks the student to pick one. It does not silently solve the first. | Must           |
| F2.7   | Multi-question batch processing.                                                                                                        | Could, Phase 3 |

### 5.3 The five-step learning sequence

| **\#** | **Requirement**                                                                                                                                                                                                                                           | **Priority** |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| F3.1   | Step 1, Understand, renders first and alone. Restates the question, names the syllabus topic, and names the exam and year where the past-question bank matches.                                                                                           | Must         |
| F3.2   | The student takes one action before the solution renders: tap "I tried this" and optionally enter their attempted answer, or tap "Show me". Both paths proceed immediately.                                                                               | Must         |
| F3.3   | Step 2, Solution, renders as discrete numbered steps, each collapsible, with the final answer visually distinct. Maths renders in proper notation.                                                                                                        | Must         |
| F3.4   | Step 3, Explanation, is at most 120 words and names the underlying principle in the language of the syllabus.                                                                                                                                             | Must         |
| F3.5   | Step 4, Follow-up, presents one variant question on the same concept, solvable in place.                                                                                                                                                                  | Must         |
| F3.6   | Step 5, Quiz, presents three to five items from the same syllabus topic, at least one from the past-question bank where coverage exists. Available on every tier with no daily cap. See section 8.                                                        | Must         |
| F3.7   | Every solution carries a visible "something is wrong here" control that opens a flag in one tap.                                                                                                                                                          | Must         |
| F3.8   | If the student entered an attempted answer at F3.2 and it was wrong, Step 3 addresses their specific error rather than giving the generic explanation. Promoted from Should: this is the only interaction in the document that Gauth does not already do. | Must         |

> *On the explanation-before-answer principle. A hard gate that withholds the answer until the student engages would lose a meaningful share of first-time users to Gauth, which shows an answer in four seconds. F3.2 keeps the ethical posture and the school conversation at a cost of one tap. Make the gate heavier only if instrumentation shows the tap is not changing behaviour.*

### 5.4 Subject-specific behaviour

| **\#** | **Requirement**                                                                                                                                                                                                          | **Priority** |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| F4.1   | Maths and physics solutions pass symbolic verification before rendering. See 6.2 and the verification service in 7.2.                                                                                                    | Must         |
| F4.2   | Chemistry handles equation balancing and stoichiometry through the same verification path. Organic mechanisms are out of scope for v1 and return a graceful limitation message.                                          | Must         |
| F4.3   | English distinguishes comprehension, grammar and lexis, and essay or summary. The first two get full solutions. Essay questions get a structure, a thesis suggestion and marking-scheme guidance, never a written essay. | Must         |
| F4.4   | History gives a structured answer with dates, actors and causes, plus an explicit note on what a WAEC marking scheme rewards for that question type.                                                                     | Must         |
| F4.5   | Every solution displays a confidence state. Below threshold, Tuto says so plainly rather than presenting a guess as fact.                                                                                                | Must         |

Refusing to write essays in F4.3 is deliberate. It is the clearest line between a study tool and a cheating tool, and it is the line schools will ask about.

### 5.5 Sessions, offline and account

| **\#** | **Requirement**                                                                                                                                                            | **Priority** |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| F6.1   | Every solved question is saved to a history, searchable by subject and topic.                                                                                              | Must         |
| F6.2   | Saved sessions are readable offline via service worker cache. Solving requires connection.                                                                                 | Must         |
| F6.3   | The student sees their remaining daily question allowance at all times on the free tier, not only when they hit the cap.                                                   | Must         |
| F6.4   | Upgrade, downgrade and cancel are self-service and take effect at period end, except cancel within 48 hours of first payment which refunds in full.                        | Must         |
| F6.5   | A weekly summary to the linked parent: questions solved, subjects, topics, quiz scores. No question content. Promoted from Should: it is sold in the section 8 tier table. | Must         |

## 6. AI Processing Pipeline

### 6.1 Standard question path, stages and cost

Costs are per question in USD at current published rates. \[ASSUMPTION A4\] Model pricing holds within 30 percent over twelve months.

| **Stage**                         | **What it does**                                                                                                                                              | **Model or service**                       | **Cost USD** |
|-----------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|--------------|
| 0\. Client preprocessing          | Crop, downscale to 1,600px, compress to JPEG q80, blur and brightness check. Runs in the browser.                                                             | None                                       | 0            |
| 1\. Extraction and classification | One multimodal call. Returns transcribed text, LaTeX, subject, question type, detected question count, syllabus topic ID, class level, extraction confidence. | Gemini 2.5 Flash                           | 0.0012       |
| 2\. Past-question match           | pgvector similarity search on the transcribed text. On a match, attaches exam, year, paper and marking scheme, and passes the scheme to Stage 3.              | Postgres + pgvector                        | ~0           |
| 3\. Solution generation           | Ordered solution steps with working, mark notes where the scheme allows, final answer, self-reported confidence.                                              | Gemini 2.5 Flash, escalating on difficulty | 0.0031       |
| 4\. Verification                  | Symbolic recomputation of quantitative answers. Second-model re-solve only where symbolic is not possible.                                                    | Verification service, see 7.2              | 0.0015       |
| 5\. Enrichment                    | Step 3 explanation, Step 4 variant, Step 5 quiz. Runs in parallel with Step 2 rendering.                                                                      | Gemini 2.5 Flash                           | 0.0020       |
|                                   | Blended total per solved question                                                                                                                             |                                            | 0.0078       |

Stage 3 arithmetic, which v0.1 omitted. \[ASSUMPTION A13\] The escalation rate to the stronger reasoning model is 8 percent of volume. Blended Stage 3 cost equals 0.92 times 0.0022 plus 0.08 times 0.013, which is 0.0031. If escalation runs at 25 percent instead of 8, Stage 3 costs 0.0049 and the blended total rises to 0.0096, still inside the 0.01 ceiling but with the margin gone. Monitor this weekly from the ModelCall table.

Stage 2 costs nothing to run and is the entire product wedge. That is the best line in this document and it is why section 10 treats the rights question as a gate rather than a risk.

Against the 0.03 ceiling in the brief, the real figure of 0.0078 gives four times headroom. The tier caps in section 8 are built backwards from the real number, not the ceiling.

### 6.2 Verification, and what happens when it is unavailable

This section did not exist in v0.1. The original text said quantitative answers are recomputed through "a computer algebra library server side," which is not achievable in the locked Node and TypeScript stack. There is no Node CAS that will symbolically verify a WAEC further-maths integral. mathjs handles basic algebra and falls over on anything real.

The verification service is therefore a separate Python container running SymPy, called over HTTP from the Next.js pipeline. It is a named component in section 7.2, it carries its own latency and cost line, and it is in Phase 1 scope in section 14.

| **Condition**                                          | **Behaviour**                                                                                                                                |
|--------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Symbolic verification agrees with the model answer     | Confidence HIGH. Render normally.                                                                                                            |
| Symbolic verification disagrees                        | One escalated re-solve. If it still disagrees, confidence LOW and the warning state in 6.4.                                                  |
| Problem is not symbolically expressible                | Second-model re-solve from the original question without sight of the first answer. Compare.                                                 |
| Verification service is down or times out at 3 seconds | Fall back to second-model verification. Confidence capped at MEDIUM. Alert fires. Never render as HIGH on an unverified quantitative answer. |
| English and history                                    | Skip symbolic verification. Run a factual-claim check on named dates and entities against the syllabus content store.                        |

### 6.3 Latency budget, including transport

v0.1 budgeted processing only and omitted the upload, which is the largest single block of time on a 3G connection. Someone reading that budget would have optimised the wrong stage.

| **Stage**                                          | **Budget**                                              | **Cumulative**               |
|----------------------------------------------------|---------------------------------------------------------|------------------------------|
| DNS, TLS and initial round trips                   | 1.2 s                                                   | 1.2 s                        |
| Image upload, 250KB at 400kbps                     | 5.0 s                                                   | 6.2 s                        |
| Stage 0, client preprocessing (runs before upload) | 0.5 s                                                   | included                     |
| Stage 1, extraction                                | 2.5 s                                                   | 8.7 s ← Step 1 renders here  |
| Stage 2, past-question match                       | 0.2 s                                                   | 8.9 s                        |
| Stage 3, solution generation                       | 5.0 s                                                   | 13.9 s ← Step 2 renders here |
| Stage 4, verification                              | 2.0 s                                                   | 15.9 s                       |
| Stage 5, enrichment (parallel with Step 2 render)  | 4.0 s                                                   | 17.9 s ← full sequence       |
|                                                    | Budget: first step under 14 s, full sequence under 22 s |                              |

G3 in section 3 has been restated from 12 seconds to 14 to match this table. A budget that contradicts its own arithmetic is not a budget.

### 6.4 Failure handling

| **Condition**                      | **What happens**                                                     | **What the student sees**                                                                                |
|------------------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Blurry or dark image               | Rejected client side, before any cost                                | "Too blurry to read. Try again with more light," plus a framing tip                                      |
| Extraction confidence low          | Pipeline halts after Stage 1                                         | The transcribed text as Tuto read it, with an edit control, and the option to proceed or retake          |
| Multiple questions detected        | Pipeline halts, crop options returned                                | "I found 3 questions. Which one?" with tappable regions                                                  |
| Handwriting unreadable             | Same as low confidence                                               | Same, plus a prompt to type it instead                                                                   |
| Diagram-dependent question         | Solved if the diagram is legible and describable, otherwise declined | Plain statement that the diagram is needed and cannot be read, with the typed-entry alternative          |
| Out of syllabus                    | Solved anyway, but labelled                                          | A banner: "This is beyond the SS3 syllabus," with the solution below                                     |
| Verification service unavailable   | Second-model fallback, confidence capped at MEDIUM                   | The solution with a "double-check this one" note                                                         |
| Verification disagreement persists | Confidence LOW                                                       | The solution with an explicit warning to check with a teacher, and the flag control raised in prominence |
| Cannot solve at all                | No fabricated answer. Does not count against the daily cap.          | "I cannot solve this one reliably," plus the syllabus topic and links to related solved examples         |
| Suspected live exam use            | Logged to the IntegritySignal table. No block.                       | Normal service, plus an honour-code reminder after repeated bursts                                       |

On exam cheating: detection is weak and false positives are harmful, so v1 does not block. Signals are logged, specifically high-volume bursts during known WAEC and JAMB exam windows, and used for an honour-code prompt rather than a lockout. v0.1 described this logging with no table to log to. The IntegritySignal model in section 11 closes that.

\[ASSUMPTION A9\] Schools will accept a visible honour code plus the no-essay-writing rule as sufficient good faith. Medium risk. Tested in the Phase 2 principal conversations.

## 7. Technical Requirements

### 7.1 Architecture

Next.js App Router with TypeScript, Prisma and PostgreSQL, as locked. Server components for everything static and for the initial shell. Client components only for the camera, the crop tool, the step interactions and the history view.

The solve pipeline runs as a server action that enqueues work and streams results, not as a blocking request. Steps stream to the client as they complete, which is what lets Step 1 appear at 8.7 seconds while Step 5 is still generating. Use a durable queue rather than in-process background work, because a dropped 3G connection must not lose a job the student already paid a question credit for.

Runtime note, added after review: the solve route runs on the Node runtime, not Edge, because it streams for up to 22 seconds and calls the verification service over HTTP. Configure maxDuration to 60 seconds on that route. Discovering this in week eight is expensive.

Route structure:

```text
/                       marketing and first-solve entry
/solve                  capture and active session
/solve/[sessionId]      a rendered sequence, shareable and cacheable
/history                saved sessions
/account                plan, billing, linked parent
/parent                 parent view of a linked student
/api/webhooks/paystack  payment events
/api/internal/verify    proxy to the verification service
```


Atlas routes are in Appendix A and are not built in v1.

### 7.2 Named services and monthly cost at 5,000 monthly active students

The inference line in v0.1 said about 40 dollars. That was wrong by roughly a factor of thirty and it made the cost table read as though infrastructure dominated. It does not. Inference dominates.

| **Layer**            | **Choice**                                         | **Rationale**                                                                       | **Monthly cost** |
|----------------------|----------------------------------------------------|-------------------------------------------------------------------------------------|------------------|
| Hosting              | Vercel                                             | Native Next.js fit, edge caching, low ops overhead                                  | 20 to 150 USD    |
| Database             | Neon or Supabase Postgres                          | Managed, pgvector support for the past-question index                               | 25 to 70 USD     |
| Verification service | Python + SymPy, containerised on Fly.io or Railway | No Node CAS exists that can do this. Separate deploy, separate failure mode.        | 10 to 30 USD     |
| Object storage       | Cloudflare R2                                      | No egress fees                                                                      | 5 to 20 USD      |
| CDN and edge         | Cloudflare                                         | Free tier covers this scale, Nigerian PoP presence is the point                     | 0 to 20 USD      |
| Queue                | Upstash QStash or Inngest                          | Serverless-native, no cluster to run                                                | 0 to 25 USD      |
| Auth                 | Clerk or Auth.js with a phone OTP provider         | Phone-first is the requirement                                                      | 25 USD plus SMS  |
| SMS OTP              | Termii or Africa’s Talking                         | Nigerian rates, roughly 3 to 4 naira per SMS against ten times that internationally | usage based      |
| Payments             | Paystack                                           | See section 8.2                                                                     | fee based        |
| Analytics            | PostHog                                            | Funnels plus session replay on the crop flow specifically                           | 0 to 50 USD      |
| Errors               | Sentry                                             |                                                                                     | 0 to 26 USD      |
| Model inference      | Gemini 2.5 Flash plus escalation                   | 150,000 questions at 0.0078 blended                                                 | ~1,150 USD       |

Fixed infrastructure runs 200 to 400 dollars monthly. Inference is the dominant cost at roughly three times that and it scales directly with questions solved. Anyone sizing a seed round from the v0.1 table would have underfunded it.

### 7.3 Performance budget

Hard requirement, not an aspiration. Target device: a mid-range Android two to three years old. Target connection: throttled 3G at 400kbps with 400ms round-trip. v0.1 budgeted JavaScript only, which let KaTeX fonts through unmeasured while still blocking paint. The budget is now total transferred bytes.

| **Metric**                                       | **Budget**                                                 |
|--------------------------------------------------|------------------------------------------------------------|
| Total transferred bytes, solve route, first load | Under 500KB                                                |
| Of which JavaScript, gzipped                     | Under 180KB                                                |
| Of which web fonts                               | Under 40KB, KaTeX subset to the characters in the syllabus |
| Largest Contentful Paint                         | Under 2.5 seconds                                          |
| Uploaded image size after client compression     | Under 250KB                                                |
| Time to first solution step, end to end          | Under 14 seconds, per 6.3                                  |

Enforce these in CI with a check that fails the build. Budgets that are not enforced are not budgets.

### 7.4 PWA and offline

Service worker caches the app shell and the last 50 solved sessions. Offline mode shows history and queues nothing. An attempt to solve while offline says so immediately rather than failing after a timeout.

### 7.5 Privacy and data protection

NDPR compliance requires a lawful basis, a retention policy, a named data protection officer contact, and an annual audit filing with the Nigeria Data Protection Commission if the processing volume threshold is crossed. \[ASSUMPTION A10\] Tuto crosses the threshold within the first year and should budget for the audit from the start. Confirm with Nigerian counsel. The DPO role is named in section 14.0, because v0.1 required one and named nobody.

Image retention: uploaded images are deleted from object storage within 24 hours of processing unless the student explicitly saves the session. The transcribed text and the generated sequence persist, the photograph does not. This is implemented in the schema, not only in a cron job, via imageKey nullable plus imagePurgedAt, so a purged image is provably purged.

No public indexing of solved questions. This is a direct contrast with Gauth, it removes a whole class of cheating enablement, and it should be said out loud in school conversations.

### 7.6 Child protection, and the honest limits of consent

This section is rewritten. v0.1 described OTP-to-a-separate-number as though it solved the problem. It does not.

The mechanism: a student who declares an age under 13 cannot solve until a parent confirms by OTP sent to a different phone number. The consent event is stored with timestamp and consenting number, because you will need to evidence it.

The known weakness, stated plainly: a twelve-year-old can borrow a friend’s phone, or enter a false date of birth, and defeat this in under a minute. This is a best-effort mechanism, not a guarantee. Tuto should not claim otherwise in marketing or in a school conversation.

The legal position: age self-declaration plus a separate-number OTP plus documented consent records is a defensible good-faith effort under NDPR, and it is what is practical in a market where household phone ownership is shared. \[ASSUMPTION A14\] This is my reading, not counsel’s. Confirm it with the same Nigerian counsel engaged for the Phase 0 gate. Medium risk.

The fallback: where Tuto learns that a consent was falsified, the account is suspended and the data is deleted. Where a parent contacts Tuto to revoke consent, the same. Both paths must exist in the admin tooling in Phase 2.

Input-side moderation: an automated check on uploaded images for content that is not an academic question. Repeated non-academic uploads suspend the account pending review.

## 8. Business Model

### 8.1 v1 pricing, two tiers

Built backwards from the real cost of 0.0078 per solved question, not from the 0.03 ceiling. \[ASSUMPTION A3\] Exchange rate of 1,550 naira to the dollar. Revisit the naira prices if it moves more than 15 percent.

|                                | **Tuto Free**                 | **Tuto Plus**                 |
|--------------------------------|-------------------------------|-------------------------------|
| Monthly price                  | ₦0                            | ₦2,499                        |
| Annual price                   | ₦0                            | ₦22,000                       |
| Questions per day              | 5                             | 40 fair use                   |
| Questions per month            | 60 cap                        | unlimited within fair use     |
| Full 5-step sequence           | yes                           | yes                           |
| Past-question matching         | yes                           | yes                           |
| Quizzes                        | unlimited on solved questions | unlimited on solved questions |
| Saved history                  | last 10                       | unlimited                     |
| Offline reading                | no                            | yes                           |
| Parent link and weekly summary | no                            | yes                           |

The quiz cap is gone, and this was the single worst error in v0.1. The free tier allowed five questions and one quiz per day. The quiz is Step 5, the end of the loop. So a free student could complete at most one loop out of five, a hard ceiling of 20 percent loop completion, against a 45 percent target, in a product whose north star is Weekly Learning Loops. The paywall was capping the metric the company is measured on. A quiz costs roughly 0.16 naira. There was never a cost case for the cap.

Five questions a day on free is enough for a normal homework night and not enough for exam cramming, which is where the paywall should sit. The 60 per month cap catches the student who does five every single day, whose monthly cost would otherwise be about 717 naira.

2,499 naira for Plus positions against a past-question booklet at 1,500 to 2,500 naira and against a single lesson session, not against a Netflix subscription. The exact figure matters: Paystack waives its 100 naira flat fee below 2,500 naira. v0.1 priced at exactly 2,500, one naira into the fee band, costing 100 naira per subscriber per month for nothing.

The annual at 22,000 naira is 27 percent off and it is the plan that matters. Exam preparation is an annual cycle. A parent who commits in September for the WAEC year is not making a monthly churn decision every month, and cash position improves at the point it is weakest. Push annual hard in the upgrade flow.

### 8.2 The Atlas tier, indicative only

Not committed. An Atlas tier at roughly 5,500 naira monthly is the working hypothesis, on the reasoning that a visual learning layer is worth roughly double the core product. There is no evidence for that reasoning. It is not priced, not announced and not built into the upgrade flow until the Phase 2 signal test returns. See section 14.

### 8.3 Payments

Paystack, not Flutterwave. Three reasons. Its Nigerian-only focus shows in checkout conversion and dispute handling. Dedicated virtual accounts let a parent pay by bank transfer, which matters because transfer is the default payment behaviour here and card abandonment is high. Recurring billing on Nigerian cards is more reliably implemented. Flutterwave becomes the right answer at multi-country expansion, so put the integration behind an interface and make the swap a week of work rather than a rewrite.

For a student without a card: the dedicated virtual account path lets a parent transfer from any bank app. Add airtime-to-subscription only if transfer conversion disappoints, because airtime conversion carries 30 to 40 percent fees and destroys the margin.

Paystack local card fee is 1.5 percent plus 100 naira, with the flat fee waived below 2,500 naira and the total capped at 2,000 naira. At 2,499 the fee is about 37 naira. On the 22,000 annual it is about 430 naira, or 36 naira a month.

### 8.4 Unit economics per paying student

\[ASSUMPTION A6\] A Plus student solves 80 questions a month, not the 1,200 the fair-use cap allows. High risk, and now also risk R3 in section 10, which v0.1 omitted.

| **Line**                              | **Monthly plan**      | **Annual plan, per month** |
|---------------------------------------|-----------------------|----------------------------|
| Revenue                               | ₦2,499                | ₦1,833                     |
| Payment fee                           | (₦37)                 | (₦36)                      |
| Inference, 80 questions at 0.0078 USD | (₦955)                | (₦955)                     |
| Infrastructure share                  | (₦125)                | (₦125)                     |
| Gross margin                          | ₦1,382, or 55 percent | ₦717, or 39 percent        |

At 300 questions a month rather than 80, inference is 3,580 naira and the monthly plan loses about 1,243 naira per subscriber. That is the fastest route to an insolvent business in this document and it is why A6 now carries an alert threshold wired to UsageCounter.inferenceCostMicros.

### 8.5 Cost levers, in order of size

4.  Semantic caching of repeated questions. Past questions repeat. A cache on the normalised question text plus embedding will serve a meaningful share at zero inference cost. \[ASSUMPTION A7\] 20 to 30 percent hit rate once the bank is populated, which cuts inference by the same proportion.

5.  Routing more volume to the cheap model by improving the difficulty classifier. Every point off the 8 percent escalation rate is real money.

6.  Client-side rejection of bad images, already in Stage 0.

7.  Prompt compression on the syllabus taxonomy, which is sent on every call.

The blended margin is thin enough that the annual plan and the cache hit rate are not optimisations, they are the business model. Model both before building.

## 9. Go To Market

This section did not exist in v0.1. The document set a Phase 2 exit criterion of one hundred paying subscribers and contained nothing that could produce them: no channel, no budget, no owner. A product document that claims pricing, margin and conversion targets cannot decline the question of where the customers come from.

### 9.1 The arithmetic the plan has to satisfy

One hundred paying subscribers at a 4 percent conversion rate needs 2,500 free signups inside the eight weeks of Phase 2. That is roughly 45 signups a day. Every channel below is judged against that number.

### 9.2 Channels

| **Channel**                 | **How it works**                                                                                                                                                                   | **Assumed share of the 2,500** | **Monthly budget**   |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|----------------------|
| WhatsApp and TikTok content | Short solved-question clips on real WAEC and JAMB past questions, posted daily, with a link. Organic first, boosted on what performs.                                              | 50 percent                     | ₦150,000             |
| School partnerships         | Three to five principals given free Plus for their staff in exchange for a mention in a parents’ meeting or a school WhatsApp group. Doubles as the R6 mitigation and the A9 test. | 30 percent                     | ₦50,000 in materials |
| Referral                    | A free student who refers a friend gets seven days of Plus. Both sides.                                                                                                            | 15 percent                     | cost of granted days |
| Paid search and social      | Small test budget only, to establish a baseline CAC rather than to drive volume in Phase 2.                                                                                        | 5 percent                      | ₦100,000             |

\[ASSUMPTION A15\] The channel mix above is a first guess with no basis. High risk, because the Phase 2 exit criterion depends on it entirely. It is tested from Phase 2 week one and the mix should be rewritten at week four against real numbers.

### 9.3 CAC and payback

\[ASSUMPTION A16\] Target blended CAC of 3,000 naira per paying subscriber. At a monthly gross margin of 1,382 naira, payback is 2.2 months on the monthly plan and 4.2 months on the annual. High risk: if real CAC is 8,000 naira, the monthly plan never pays back inside a plausible lifetime and annual becomes the only viable product.

\[ASSUMPTION A17\] Assumed subscriber lifetime of 9 months, giving an LTV of about 12,400 naira on monthly and an LTV to CAC ratio of roughly 4:1. There is no basis for 9 months. It is a placeholder until Phase 2 produces a retention curve. Treat any LTV in a fundraising conversation as unevidenced until then.

Owner: founder, until there is a growth hire. The acquisition budget above totals roughly 300,000 naira a month and must appear in the burn figure in section 14.0.

## 10. Risks

The past-question rights question has been removed from this table. A risk that blocks the entire company is not a risk, it is a gate, and it is now Phase 0 in section 14. Usage overrun has been added, which v0.1 marked as a high-risk assumption and then left off the register entirely.

| **\#** | **Risk**                                                                                                                                                              | **Likelihood** | **Impact** | **Mitigation**                                                                                                                                                                                                                                                                      |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| R1     | Accuracy failures destroy trust early. One confidently wrong maths answer shared in a class WhatsApp group outweighs a thousand correct ones.                         | High           | Fatal      | Symbolic verification on every quantitative answer. Visible confidence states. Refuse rather than guess. Weekly benchmark in CI that blocks deploys below threshold. Flag-to-fix under 48 hours with a reply to the student who flagged. Owned by the named accuracy owner in 14.0. |
| R2     | Willingness to pay is below 2,499 naira and conversion lands near 1 percent, not 4.                                                                                   | Medium-high    | Severe     | The A2 price test runs in parallel with Phase 1, before the pricing is built. A 1,500 naira tier held ready as a fallback. Lean on annual and on school-brokered parent offers.                                                                                                     |
| R3     | Usage overrun. A Plus student solves 300 questions a month rather than 80.                                                                                            | Medium         | Severe     | Fair-use enforcement at 40 per day. Cost-per-user alert at 1,500 naira monthly wired to UsageCounter.inferenceCostMicros. Hard review above it. Instrumented from Phase 1, before any paying users exist.                                                                           |
| R4     | Gauth or a competitor ships a Nigerian curriculum pack. The wedge is a content wedge, not a technology wedge, and content wedges can be copied by anyone with budget. | Medium         | Severe     | Speed and depth. Marking-scheme-level detail is harder to copy than topic tagging. Build teacher and school relationships a foreign product cannot. Accept this is a two-year window and use it to build the mastery data layer, which is genuinely hard to copy.                   |
| R5     | Acquisition does not work. The Phase 2 channel mix in section 9 fails to produce 2,500 signups.                                                                       | Medium-high    | Severe     | Rewrite the mix at Phase 2 week four against real numbers rather than at the end. Treat the one hundred subscriber exit criterion as a gate on the seed raise, not a formality.                                                                                                     |
| R6     | School backlash brands Tuto a cheating tool and closes the influence channel.                                                                                         | Medium         | Moderate   | No essay writing. No public question index. Visible honour code. Engage three to five principals in Phase 2, not after.                                                                                                                                                             |
| R7     | The verification service becomes an operational burden: a second language, a second deploy target, a second on-call surface.                                          | Medium         | Moderate   | Keep it stateless and single-purpose. Graceful degradation is specified in 6.2, so an outage lowers confidence rather than stopping the product.                                                                                                                                    |
| R8     | Data cost and connectivity friction suppress usage regardless of product quality.                                                                                     | Medium         | Moderate   | The performance budget in 7.3, enforced in CI. Consider an operator zero-rating conversation once usage justifies it.                                                                                                                                                               |
| R9     | Model pricing rises or the vendor deprecates the model the pipeline depends on.                                                                                       | Medium         | Moderate   | Abstract the model call behind an interface from day one. Maintain a benchmark suite that can score a replacement in an afternoon.                                                                                                                                                  |
| R10    | Free tier abuse via multiple accounts on one device.                                                                                                                  | Medium         | Low        | Device fingerprint plus phone verification at the second question. Accept some leakage.                                                                                                                                                                                             |

### 10.1 Does the wedge hold?

It holds, but not as strongly as the original brief implied. Curriculum fit is real and Gauth has no incentive to build it until Nigeria is worth the effort. Naira pricing is real and structurally hard for a dollar-priced global product to match. Page weight is real. None of these are defensible for long on their own. What compounds is the past-question bank plus the usage data that tells you which topics students actually get wrong, which is exactly the mastery layer deferred to Phase 3. The wedge buys time to build the moat. Do not mistake one for the other.

## 11. Prisma Data Model

The v0.1 schema did not compile. QuestionSubmission declared a relation to PastQuestion with no back-relation field, which fails Prisma validation before a client is generated. Four models held user or world IDs as bare strings with no foreign key, including UsageCounter, which is the table that gates revenue: with no foreign key, a deleted user leaves orphaned meter rows and a mistyped ID silently creates a fresh daily allowance. Solution recorded cache hits as a bare boolean, so a poisoned cache entry could not be traced to the students it reached. All of that is fixed below.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// ============ Identity ============

enum UserRole {
  STUDENT
  PARENT
  REVIEWER
  ADMIN
}

enum ClassLevel {
  JSS1
  JSS2
  JSS3
  SS1
  SS2
  SS3
}

enum TargetExam {
  WAEC
  NECO
  JAMB
  NONE
}

model User {
  id            String    @id @default(cuid())
  role          UserRole  @default(STUDENT)
  phone         String?   @unique
  email         String?   @unique
  displayName   String?
  phoneVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastSeenAt    DateTime?
  deletedAt     DateTime?

  studentProfile   StudentProfile?
  subscriptions    Subscription[]
  guardianOf       GuardianLink[]  @relation("GuardianUser")
  guardians        GuardianLink[]  @relation("StudentGuardian")
  usageCounters    UsageCounter[]
  submissions      QuestionSubmission[]
  quizAttempts     QuizAttempt[]
  atlasViews       AtlasView[]
  integritySignals IntegritySignal[]
  flags            ContentFlag[]
  reviewsDone      ContentReview[] @relation("Reviewer")
  devices          Device[]

  @@index([phone])
  @@index([lastSeenAt])
}

model StudentProfile {
  id                   String     @id @default(cuid())
  userId               String     @unique
  user                 User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  classLevel           ClassLevel
  targetExam           TargetExam @default(NONE)
  schoolName           String?
  stateCode            String?
  dateOfBirth          DateTime?
  isMinorUnder13       Boolean    @default(false)
  consentGrantedAt     DateTime?
  consentPhone         String?
  consentRevokedAt     DateTime?
  honourCodeAcceptedAt DateTime?
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  @@index([classLevel, targetExam])
}

// Links a paying parent to one or more student accounts.
// Both sides are now real relations. v0.1 held studentId as a bare string.
model GuardianLink {
  id          String    @id @default(cuid())
  guardianId  String
  guardian    User      @relation("GuardianUser", fields: [guardianId], references: [id], onDelete: Cascade)
  studentId   String
  student     User      @relation("StudentGuardian", fields: [studentId], references: [id], onDelete: Cascade)
  linkCode    String    @unique
  confirmedAt DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@unique([guardianId, studentId])
  @@index([studentId])
  @@index([linkCode])
}

model Device {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fingerprint String
  userAgent   String?
  lastSeenAt  DateTime @default(now())
  createdAt   DateTime @default(now())

  @@unique([userId, fingerprint])
  @@index([fingerprint])
}

// ============ Billing ============

enum PlanTier {
  FREE
  PLUS
  ATLAS
}

enum BillingInterval {
  MONTHLY
  ANNUAL
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  EXPIRED
}

// interval is nullable so FREE does not need a fake MONTHLY row.
// Uniqueness moved to an explicit code, since a composite unique with a
// nullable column does not constrain in Postgres.
model Plan {
  id                    String           @id @default(cuid())
  code                  String           @unique // free, plus_monthly, plus_annual
  tier                  PlanTier
  interval              BillingInterval?
  priceKobo             Int              // kobo, never a float
  currency              String           @default("NGN")
  dailyQuestionCap      Int?             // null means fair-use unlimited
  monthlyQuestionCap    Int?
  monthlyAtlasViews     Int?
  allowsAtlasGeneration Boolean          @default(false)
  allowsOffline         Boolean          @default(false)
  allowsParentSummary   Boolean          @default(false)
  isActive              Boolean          @default(true)
  createdAt             DateTime         @default(now())

  subscriptions Subscription[]
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  planId               String
  plan                 Plan               @relation(fields: [planId], references: [id])
  status               SubscriptionStatus @default(ACTIVE)
  payerUserId          String?            // the parent, when different from the student
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  cancelledAt          DateTime?
  paystackCustomerCode String?
  paystackSubCode      String?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  payments Payment[]

  @@index([userId, status])
  @@index([currentPeriodEnd, status])
  @@index([paystackSubCode])
}

model Payment {
  id             String       @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  amountKobo     Int
  feeKobo        Int?
  currency       String       @default("NGN")
  status         String
  channel        String?      // card, bank_transfer, ussd
  paystackRef    String       @unique
  paidAt         DateTime?
  createdAt      DateTime     @default(now())

  @@index([subscriptionId, createdAt])
}

// Usage metering. One row per user per UTC day, incremented atomically.
// userId is now a real relation. This table gates revenue.
model UsageCounter {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  day                 DateTime @db.Date
  questionsUsed       Int      @default(0)
  quizzesUsed         Int      @default(0)
  atlasViewsUsed      Int      @default(0)
  atlasGensUsed       Int      @default(0)
  inferenceCostMicros Int      @default(0) // USD micros. Backs the R3 alert.
  updatedAt           DateTime @updatedAt

  @@unique([userId, day])
  @@index([day])
}

// ============ Syllabus and past questions ============

enum Subject {
  MATHEMATICS
  PHYSICS
  CHEMISTRY
  BIOLOGY
  ENGLISH
  HISTORY
}

enum ExamBoard {
  WAEC
  NECO
  JAMB
}

model SyllabusTopic {
  id            String          @id @default(cuid())
  subject       Subject
  board         ExamBoard
  code          String
  title         String
  slug          String          @unique
  parentId      String?
  parent        SyllabusTopic?  @relation("TopicTree", fields: [parentId], references: [id])
  children      SyllabusTopic[] @relation("TopicTree")
  classLevels   ClassLevel[]
  frequencyRank Int?
  createdAt     DateTime        @default(now())

  pastQuestions PastQuestion[]
  submissions   QuestionSubmission[]
  atlasWorlds   AtlasWorld[]
  quizItems     QuizItem[]

  @@unique([board, subject, code])
  @@index([subject, board, frequencyRank])
}

model PastQuestion {
  id             String         @id @default(cuid())
  board          ExamBoard
  subject        Subject
  year           Int
  paper          String?
  questionNumber String?
  bodyText       String
  bodyLatex      String?
  optionsJson    Json?
  correctOption  String?
  markingScheme  String?
  topicId        String?
  topic          SyllabusTopic? @relation(fields: [topicId], references: [id])
  embedding      Unsupported("vector(768)")?
  sourceLicence  String?        // provenance, required by the Phase 0 gate
  sourceNote     String?
  createdAt      DateTime       @default(now())

  // Back-relation added. Its absence is why v0.1 did not compile.
  submissions QuestionSubmission[]

  @@index([board, subject, year])
  @@index([topicId])
}

// ============ Solving ============

enum SubmissionStatus {
  UPLOADED
  EXTRACTING
  AWAITING_CROP
  AWAITING_CONFIRM
  SOLVING
  COMPLETE
  FAILED
  DECLINED
}

enum ConfidenceLevel {
  HIGH
  MEDIUM
  LOW
  UNRESOLVED
}

model QuestionSubmission {
  id                    String             @id @default(cuid())
  userId                String
  user                  User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  status                SubmissionStatus   @default(UPLOADED)
  inputMethod           String             // image, typed
  imageKey              String?            // R2 key, nulled after 24h
  imagePurgedAt         DateTime?
  transcribedText       String?
  transcribedLatex      String?
  studentEditedText     Boolean            @default(false)
  subject               Subject?
  topicId               String?
  topic                 SyllabusTopic?     @relation(fields: [topicId], references: [id])
  matchedPastQuestionId String?
  matchedPastQuestion   PastQuestion?      @relation(fields: [matchedPastQuestionId], references: [id])
  matchScore            Float?
  embedding             Unsupported("vector(768)")?
  detectedCount         Int                @default(1)
  extractionConfidence  Float?
  attemptedAnswer       String?            // the student's own answer, before the reveal
  revealedAt            DateTime?
  declineReason         String?
  createdAt             DateTime           @default(now())
  completedAt           DateTime?

  solution   Solution?
  quiz       Quiz?
  flags      ContentFlag[]
  modelCalls ModelCall[]

  @@index([userId, createdAt])
  @@index([topicId, createdAt])
  @@index([status, createdAt])
}

model Solution {
  id                 String          @id @default(cuid())
  submissionId       String          @unique
  submission         QuestionSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  finalAnswer        String?
  finalAnswerLatex   String?
  confidence         ConfidenceLevel @default(HIGH)
  verified           Boolean         @default(false)
  verificationMethod String?         // symbolic, second_model, none, service_unavailable
  explanation        String?         // step 3
  followUpPrompt     String?         // step 4
  followUpAnswer     String?
  // Replaces the bare servedFromCache boolean, so a bad cache entry can be
  // traced to every student it reached.
  cacheId            String?
  cache              SolutionCache?  @relation(fields: [cacheId], references: [id], onDelete: SetNull)
  createdAt          DateTime        @default(now())

  steps SolutionStep[]

  @@index([confidence, verified])
  @@index([cacheId])
}

model SolutionStep {
  id           String   @id @default(cuid())
  solutionId   String
  solution     Solution @relation(fields: [solutionId], references: [id], onDelete: Cascade)
  ordinal      Int
  statement    String
  workingLatex String?
  markNote     String?  // what the marking scheme awards here
  createdAt    DateTime @default(now())

  @@unique([solutionId, ordinal])
}

// ============ Quizzes ============

model Quiz {
  id           String              @id @default(cuid())
  submissionId String?             @unique
  submission   QuestionSubmission? @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  topicId      String?
  createdAt    DateTime            @default(now())

  items    QuizItem[]
  attempts QuizAttempt[]
}

model QuizItem {
  id                   String         @id @default(cuid())
  quizId               String
  quiz                 Quiz           @relation(fields: [quizId], references: [id], onDelete: Cascade)
  topicId              String?
  topic                SyllabusTopic? @relation(fields: [topicId], references: [id])
  sourcePastQuestionId String?        // null means generated
  ordinal              Int
  prompt               String
  optionsJson          Json
  correctOption        String
  rationale            String?

  responses QuizResponse[]

  @@unique([quizId, ordinal])
  @@index([topicId])
}

model QuizAttempt {
  id          String    @id @default(cuid())
  quizId      String
  quiz        Quiz      @relation(fields: [quizId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  score       Int?
  total       Int?

  responses QuizResponse[]

  @@index([userId, completedAt])
  @@index([quizId])
}

model QuizResponse {
  id             String      @id @default(cuid())
  attemptId      String
  attempt        QuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  itemId         String
  item           QuizItem    @relation(fields: [itemId], references: [id], onDelete: Cascade)
  selectedOption String?
  isCorrect      Boolean
  answeredAt     DateTime    @default(now())

  @@unique([attemptId, itemId])
}

// ============ Integrity ============
// New. v0.1 specified cheating-signal logging with no table to log to.

enum IntegritySignalType {
  EXAM_WINDOW_BURST
  RAPID_SEQUENTIAL
  NON_ACADEMIC_UPLOAD
  MULTI_ACCOUNT_DEVICE
}

model IntegritySignal {
  id          String              @id @default(cuid())
  userId      String
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  signalType  IntegritySignalType
  examWindow  Boolean             @default(false)
  boardInPlay ExamBoard?
  itemCount   Int?
  windowStart DateTime?
  windowEnd   DateTime?
  notedAt     DateTime            @default(now())

  @@index([userId, notedAt])
  @@index([signalType, notedAt])
}

// ============ Atlas (Appendix A, not built in v1) ============

enum AtlasLayout {
  MAP
  TIMELINE
  CUTAWAY
  PROCESS
}

enum PublishState {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  WITHDRAWN
}

model AtlasWorld {
  id                   String        @id @default(cuid())
  topicId              String
  topic                SyllabusTopic @relation(fields: [topicId], references: [id])
  slug                 String        @unique
  title                String
  layout               AtlasLayout
  sceneSvgKey          String?
  payloadBytes         Int?
  state                PublishState  @default(DRAFT)
  sensitiveTopic       Boolean       @default(false)
  generationCostMicros Int?
  generatedAt          DateTime?
  publishedAt          DateTime?
  version              Int           @default(1)

  nodes      AtlasNode[]
  views      AtlasView[]
  modelCalls ModelCall[]
  flags      ContentFlag[]
  reviews    ContentReview[]

  @@unique([topicId, version])
  @@index([state, publishedAt])
}

model AtlasNode {
  id         String      @id @default(cuid())
  worldId    String
  world      AtlasWorld  @relation(fields: [worldId], references: [id], onDelete: Cascade)
  parentId   String?
  parent     AtlasNode?  @relation("NodeTree", fields: [parentId], references: [id])
  children   AtlasNode[] @relation("NodeTree")
  depth      Int         @default(0) // enforced max 1
  label      String
  bodyText   String?
  positionX  Float?
  positionY  Float?
  timelineAt DateTime?

  sources AtlasNodeSource[]

  @@index([worldId, depth])
}

model AtlasSource {
  id          String   @id @default(cuid())
  title       String
  sourceUrl   String
  licence     String   // CC BY-SA 4.0, public domain, etc
  attribution String
  assetKey    String?
  createdAt   DateTime @default(now())

  nodes AtlasNodeSource[]

  @@index([licence])
}

model AtlasNodeSource {
  nodeId   String
  node     AtlasNode   @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  sourceId String
  source   AtlasSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@id([nodeId, sourceId])
}

model AtlasView {
  id           String     @id @default(cuid())
  worldId      String
  world        AtlasWorld @relation(fields: [worldId], references: [id], onDelete: Cascade)
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  nodesOpened  Int        @default(0)
  dwellSeconds Int        @default(0)
  viewedAt     DateTime   @default(now())

  @@index([userId, viewedAt])
  @@index([worldId, viewedAt])
}

// ============ Trust and review ============

enum FlagReason {
  WRONG_ANSWER
  WRONG_METHOD
  UNREADABLE
  INAPPROPRIATE
  SOURCE_PROBLEM
  OTHER
}

enum FlagStatus {
  OPEN
  TRIAGED
  RESOLVED
  REJECTED
}

model ContentFlag {
  id           String              @id @default(cuid())
  userId       String
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  submissionId String?
  submission   QuestionSubmission? @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  worldId      String?
  world        AtlasWorld?         @relation(fields: [worldId], references: [id], onDelete: Cascade)
  reason       FlagReason
  note         String?
  status       FlagStatus          @default(OPEN)
  createdAt    DateTime            @default(now())
  resolvedAt   DateTime?

  review ContentReview?

  @@index([status, createdAt])
  @@index([userId])
}

model ContentReview {
  id         String       @id @default(cuid())
  flagId     String?      @unique
  flag       ContentFlag? @relation(fields: [flagId], references: [id])
  worldId    String?
  world      AtlasWorld?  @relation(fields: [worldId], references: [id])
  reviewerId String
  reviewer   User         @relation("Reviewer", fields: [reviewerId], references: [id])
  verdict    String
  correction String?
  reviewedAt DateTime     @default(now())

  @@index([reviewerId, reviewedAt])
}

// Cost and latency observability. Written on every model call.
// worldId is now a real relation.
model ModelCall {
  id           String              @id @default(cuid())
  submissionId String?
  submission   QuestionSubmission? @relation(fields: [submissionId], references: [id], onDelete: SetNull)
  worldId      String?
  world        AtlasWorld?         @relation(fields: [worldId], references: [id], onDelete: SetNull)
  stage        String              // extract, solve, verify, enrich, atlas_plan, atlas_nodes
  provider     String
  model        String
  inputTokens  Int?
  outputTokens Int?
  costMicros   Int
  latencyMs    Int
  succeeded    Boolean             @default(true)
  errorCode    String?
  createdAt    DateTime            @default(now())

  @@index([stage, createdAt])
  @@index([model, createdAt])
}

// Semantic cache for repeated questions. The largest cost lever.
model SolutionCache {
  id             String    @id @default(cuid())
  normalisedHash String    @unique
  embedding      Unsupported("vector(768)")?
  subject        Subject
  topicId        String?
  payload        Json      // the full rendered sequence
  hitCount       Int       @default(0)
  lastHitAt      DateTime?
  invalidatedAt  DateTime?
  createdAt      DateTime  @default(now())

  solutions Solution[]

  @@index([subject, topicId])
  @@index([hitCount])
}
```


### 11.1 Notes on the non-obvious decisions

Money is stored in kobo as integers. Never a float, never a decimal string. Paystack works in kobo and so should you.

UsageCounter is a separate table, not a field on User. Metering is the highest-write path in the system and must be atomic under concurrent requests from the same account on two devices. A dedicated table with a unique key on user and day allows a single upsert with an atomic increment, and gives a free daily activity history. It now carries a real foreign key, which v0.1 omitted on the one table that decides whether a student gets to solve.

ModelCall exists from day one. Cost per question is a core metric and an unmeasured margin is a fictional margin. A row per model call costs almost nothing and gives real-time cost per user, per stage and per model, which is what makes the R9 model-swap decision easy.

SolutionCache is keyed on a normalised hash plus an embedding for near-match lookup, and stores a rendered payload rather than a relation graph, because the point is to serve it without a join. It has no user relation, deliberately, so a cache hit leaks nothing between students. Solution now points back at it, so when a cached answer turns out to be wrong you can find every student who received it and message them. Given that R1 is accuracy and the cache is the largest cost lever, that is the audit trail you will want most.

AtlasWorld is versioned, not mutated. A corrected world creates version two and the old one is withdrawn. This keeps cached edge copies coherent and gives an audit trail on sensitive content.

imageKey nullable plus imagePurgedAt implements the retention policy in the schema, not only in a cron job, so a purged image is provably purged.

PastQuestion.sourceLicence and sourceNote. Every item in the bank needs recorded provenance from the day the first row is written. Retrofitting this is painful and the Phase 0 gate may require it in a rights conversation.

### 11.2 Indexes and migrations that matter at scale

The three that decide performance: the pgvector index on PastQuestion.embedding for past-question matching, the same on SolutionCache.embedding for cache lookup, and UsageCounter(userId, day), which is hit on every solve. Build both vector indexes as HNSW. Monitor the composite on QuestionSubmission(userId, createdAt), which backs the history page and grows fastest.

Embedding dimension migration note, added after review. The 768 dimension is fixed by the chosen embedding model and is hardcoded in two of the largest tables. Changing embedding model requires a backfill migration across PastQuestion and SolutionCache. Budget one engineer-week and do not treat the embedding model as a casual swap.

Run prisma validate and prisma format in CI. The v0.1 schema shipped uncompiled to a reviewer, which should not happen twice.

## 12. Success Metrics

North star: Weekly Learning Loops. The count of distinct students who complete at least one full sequence, from upload through to a submitted quiz, in a seven-day window. It captures usage, product quality and educational intent in one number, and it cannot be gamed by answer-grabbing. Target: 1,200 weekly learning loops by the end of Phase 3, week 30. v0.1 said month six here and week 30 in the roadmap. Week 30 is the number.

| **Metric**                    | **Definition**                                                      | **Instrumentation**                            | **Target**                       | **Basis**                                                                      |
|-------------------------------|---------------------------------------------------------------------|------------------------------------------------|----------------------------------|--------------------------------------------------------------------------------|
| Loop completion rate          | Submitted quizzes divided by completed solutions                    | QuizAttempt.completedAt against Solution count | 45 percent                       | First guess. Now reachable on free, since the quiz cap is gone.                |
| Verified accuracy             | Benchmark pass rate on the 500-item past-question set, weekly in CI | Automated benchmark job, results stored        | 95 / 90 percent                  | Derived                                                                        |
| Flag rate                     | Flags opened per 1,000 solutions, by reason                         | ContentFlag                                    | Under 8 per 1,000, trending down | First guess, no basis. Set a real threshold after Phase 1 produces a baseline. |
| Free to paid at 60 days       | Weekly cohort holding an active paid subscription 60 days later     | Subscription joined to User.createdAt          | 4 percent                        | First guess. Tested by A2.                                                     |
| Blended cost per solution     | Sum of ModelCall.costMicros divided by completed solutions, weekly  | ModelCall                                      | Under 0.01 USD                   | Derived from 6.1                                                               |
| Time to first step, p75       | Upload start to Step 1 painted, segmented by connection type        | PostHog custom event                           | Under 14 s on 3G                 | Derived from 6.3                                                               |
| Cost per active user, monthly | UsageCounter.inferenceCostMicros summed per user per month          | UsageCounter                                   | Alert above ₦1,500               | Derived from 8.4. Backs R3.                                                    |

Second-attempt quiz improvement is the metric everyone will want and it is deliberately absent. Measuring it properly needs the same student attempting the same topic twice at a spaced interval, which needs the mastery layer deferred to Phase 3. A within-session retry number would look good in a deck and would mean nothing.

## 13. Assumptions

Every assumption in one place. Each high-risk assumption now carries a test method, an owner and a date, and each of those tests appears as a task in section 14. v0.1 correctly identified its three most dangerous assumptions and then scheduled only one of them.

| **\#** | **Assumption**                                                                      | **Risk** | **Test, owner, when**                                                                                                  |
|--------|-------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------------------------------------------------|
| A1     | Students split roughly 30 percent checkers, 70 percent answer-seekers               | High     | Fifty student conversations. Founder. Phase 1, week 1.                                                                 |
| A2     | Willingness to pay sits near ₦2,499 monthly                                         | High     | Landing page with live Paystack checkout, two price points. Founder. Runs in parallel across Phase 1, reads at week 6. |
| A3     | Exchange rate of ₦1,550 to the dollar holds within 15 percent                       | Medium   | Monitored. Founder. Quarterly review of naira prices.                                                                  |
| A4     | Model pricing holds within 30 percent over twelve months                            | Medium   | Mitigated by the provider abstraction in R9. No test.                                                                  |
| A5     | Client-side quality checks reject about 15 percent of uploads                       | Low      | Observed from Phase 1 instrumentation. Affects cost modelling only.                                                    |
| A6     | A Plus student solves about 80 questions a month                                    | High     | Instrumented from Phase 1 day one via UsageCounter. Alert at ₦1,500 per user per month. Engineering lead.              |
| A7     | Semantic cache hit rate reaches 20 to 30 percent                                    | Medium   | Measured from Phase 1 once the bank exists. Engineering lead.                                                          |
| A9     | Schools accept the honour code plus no-essay rule as good faith                     | Medium   | Three to five principal conversations. Founder. Phase 2, weeks 1 to 4.                                                 |
| A10    | Tuto crosses the NDPR audit threshold in year one                                   | Low      | Confirm with counsel during the Phase 0 engagement.                                                                    |
| A11    | A teacher persona needs no product surface in v1                                    | Low      | Revisit after Phase 3 subject to Q5.                                                                                   |
| A12    | Gemini 2.5 Flash performs adequately on Nigerian past-question maths OCR            | High     | Two-day benchmark on 200 real past questions. Engineering lead. Phase 1, week 1, before any architecture commits.      |
| A13    | Escalation to the stronger model runs at 8 percent of volume                        | Medium   | Measured weekly from ModelCall. Engineering lead. From Phase 1.                                                        |
| A14    | Separate-number OTP is a defensible good-faith consent effort under NDPR            | Medium   | Confirm with counsel during the Phase 0 engagement.                                                                    |
| A15    | The Phase 2 channel mix produces 2,500 signups                                      | High     | Measured from Phase 2 week 1. Mix rewritten at week 4. Founder.                                                        |
| A16    | Blended CAC of ₦3,000 per paying subscriber                                         | High     | Measured from Phase 2 spend. Founder.                                                                                  |
| A17    | Subscriber lifetime of 9 months                                                     | High     | No basis. Placeholder until a Phase 2 retention curve exists. Do not use in a fundraising conversation before then.    |
| T1     | Loop completion of 45 percent, conversion of 4 percent, flag rate under 8 per 1,000 | High     | All three are invented targets, listed here because v0.1 presented them as derived. Revise all three after Phase 1.    |

## 14. Phased Roadmap

### 14.0 Team, capacity and burn

v0.1 gave three phase durations with no team, no skill mix and no budget behind them. Work scoped without capacity is not a roadmap, it is a wish. Everything below assumes the following team. \[ASSUMPTION A18\] If the team is smaller, every duration grows and the phases must be re-derived before anyone commits to a date.

| **Role**                     | **Headcount** | **Notes**                                                                                                                                                                                                                         | **Monthly cost** |
|------------------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|
| Founder / product            | 1             | Also owns the Phase 0 gate, the A1 and A2 tests, school conversations and acquisition until a growth hire                                                                                                                         | founder equity   |
| Full-stack engineer (lead)   | 1             | Next.js, TypeScript, Prisma. Owns the pipeline and the schema.                                                                                                                                                                    | ₦1,200,000       |
| Full-stack engineer          | 1             | Front end, PWA, crop and camera, payments integration                                                                                                                                                                             | ₦800,000         |
| Python engineer, part time   | 0.5           | Verification service. Can be contract. New scope, added after review.                                                                                                                                                             | ₦400,000         |
| Content and accuracy owner   | 1             | Syllabus taxonomy, past-question bank, weekly benchmark review, flag queue at a 48-hour turnaround. This role was Q3 in v0.1, listed as an open question with "Founder" as the answer, which is a vacancy rather than a decision. | ₦500,000         |
| Designer, part time          | 0.3           | Solve flow, plus the three hand-built Atlas worlds in Phase 2                                                                                                                                                                     | ₦300,000         |
| Infrastructure and inference |               | Per section 7.2, rising with usage                                                                                                                                                                                                | ₦600,000         |
| Acquisition budget           |               | Per section 9.2, Phase 2 onward                                                                                                                                                                                                   | ₦300,000         |
| Total monthly burn           |               | Excluding founder                                                                                                                                                                                                                 | ~₦4,100,000      |

At roughly 4.1 million naira a month, the thirty weeks below cost about 28 million naira, or 18,000 dollars at the assumed rate, before founder compensation. That number belongs in any seed conversation and it was absent from v0.1 entirely.

### 14.1 Phase 0: The gate. Weeks minus two to zero.

No application code is written until this closes. It was ranked as risk R2 in v0.1 and then scheduled around, with the past-question bank built inside Phase 1.

The question: do we have the legal right to build and serve a WAEC and NECO past-question and marking-scheme bank? Past papers and marking schemes are copyrighted. The bank is the entire wedge, it is the thing that makes Stage 2 free, and it may not be ours to build.

Three options, all to be priced: license directly from WAEC and NECO; license from an established booklet publisher who already holds rights; or build an original question bank aligned to the published syllabus without reproducing papers, which is slower, weaker and legally clean.

Owner: founder, with Nigerian IP counsel. Decision date: before Phase 1 week 1. Hard rule: no past-question data is ingested into any system until this closes. The same counsel engagement answers A10 and A14.

### 14.2 Phase 1: Prove the loop. Weeks 1 to 12.

Two weeks longer than v0.1, because the verification service was missing from the original scope and because the A1 and A2 tests are now in the plan rather than only in the assumptions table.

Week 1, before architecture commits: benchmark Gemini 2.5 Flash on 200 real past questions (A12). Fifty student conversations (A1). Stand up the landing page price test (A2), which then runs in the background.

Weeks 2 to 12: the solve pipeline, the five-step sequence, maths and science, image and typed input, quizzes with no cap, history, accounts, the syllabus taxonomy, the verification service, and the past-question bank for maths and one science subject under whatever rights position Phase 0 produced. Instrument UsageCounter and ModelCall from day one, with the R3 alert live before any paying users exist. Free tier only, no payments.

Exit criteria: 95 percent benchmark accuracy on maths, 45 percent loop completion, first step under 14 seconds on 3G, 300 weekly learning loops from a seeded cohort, and a read on A1 and A2.

### 14.3 Phase 2: Prove the payment. Weeks 13 to 22.

Two weeks longer than v0.1, because acquisition is now real work in the plan rather than an assumed outcome.

Product: English and history in guidance mode, Paystack, the two tiers, the parent link and weekly summary, offline reading, PWA install, and the admin tooling for consent revocation and account suspension required by 7.6.

Go to market: run the section 9 channel mix from week 1, rewrite it at week 4 against real numbers, and run the three to five principal conversations that test A9 and mitigate R6.

The Atlas signal test: three hand-built worlds shipped free and instrumented. Cost: roughly two weeks of the part-time designer plus a week of the content owner for sourcing and copy, about 450,000 naira. Measured on return visits and on explicit requests for more, not on first-view delight. v0.1 described these as effectively free, which they are not.

Exit criteria: 2,500 free signups, 100 paying subscribers, blended cost per solution under 0.01 USD, positive margin on Plus at real observed usage, and a clear Atlas signal either way.

### 14.4 Phase 3: Prove the differentiation. Weeks 23 to 34.

Build the Atlas generation pipeline if and only if the Phase 2 signal supports it, and price the Atlas tier only then. Pre-build the top 150 topics. Add multi-question processing. Begin the mastery layer, which is the actual moat. Run a small controlled study with one partner school ahead of the seed raise.

Exit criteria: 1,200 weekly learning loops, 70 percent annual plan retention at 90 days, and credible outcome evidence from the school study.

### 14.5 Why Atlas is not in v1

The reason is not cost. The pipeline in Appendix A gets a world to about six cents, well inside the forty cent ceiling in the brief. The reason is focus and evidence. Atlas is a second product with its own generation pipeline, its own review workflow, its own rendering surface and its own content operation. Building it alongside the solve loop roughly doubles the time to first paying user, and it does so before anyone has shown that students will pay for the core thing. It is also the feature most likely to be a one-time novelty: a student opens a beautiful visual world once and then goes back to solving homework. If that is true, learn it for the cost of three hand-built worlds, not for the cost of a full build.

## 15. Open Questions

Q1 and Q3 from v0.1 have been removed from this table. Q1 was a gate and is now Phase 0. Q3 asked who owns accuracy and answered "Founder," which is a vacancy, not a decision, and it is now a named role in 14.0. Every remaining question carries a decision date, so an open question is a scheduled decision rather than a parking space.

| **\#** | **Question**                                                                                        | **Decider**                                              | **Decide by**                             | **What it blocks**                                                        |
|--------|-----------------------------------------------------------------------------------------------------|----------------------------------------------------------|-------------------------------------------|---------------------------------------------------------------------------|
| Q2     | Is ₦2,499 the right Plus price, or is it ₦1,500?                                                    | Founder, from the A2 landing page test                   | Phase 1 week 6                            | Phase 2 build of the pricing and upgrade flow, and the whole margin model |
| Q4     | Which tagline, and does Tuto need a Nigerian-market name test before it is printed on anything?     | Founder                                                  | Phase 2 week 1                            | Marketing site and all Phase 2 acquisition creative                       |
| Q5     | Is the school channel influence-only, or is there a paid school product later?                      | Founder, informed by the Phase 2 principal conversations | End of Phase 2                            | Whether a teacher persona and dashboard enter the Phase 4 roadmap         |
| Q6     | Which escalation model, specifically? Section 6.1 leaves the vendor open pending the A12 benchmark. | Engineering lead                                         | Phase 1 week 2                            | Phase 1 pipeline architecture                                             |
| Q7     | Does the honour code plus no-essay position satisfy principals, or do they want more?               | Founder, from the Phase 2 conversations                  | Phase 2 week 4                            | The R6 mitigation and possibly F4.3                                       |
| Q8     | Is an operator zero-rating conversation worth having, and at what scale does it become possible?    | Founder                                                  | Revisit at 20,000 monthly active students | Nothing in v1                                                             |
| Q9     | Does the Atlas tier get priced at all, and at what number?                                          | Founder, from the Phase 2 signal test                    | End of Phase 2                            | Phase 3 scope and the entire Atlas build decision                         |

## Appendix A. Atlas Layer, Deferred Specification

> *This specification is complete and build-ready, and it is not in v1. Nothing here carries a v1 priority marker. It is built in Phase 3 only if the Phase 2 signal test returns positive. In v0.1 these requirements carried a separate "Must for the Atlas release" marker, which invented a second priority scale halfway down a table and made the document’s scope unreadable.*

### A.1 Concept

Modelled on Gauth Atlas. A student enters a topic and the system generates an interactive visual world: a map, timeline, cutaway or process flow, chosen automatically to fit the topic. Every element is clickable and opens a deeper layer. Imagery is traceable to a real source. History and biology are the strongest fits.

### A.2 Requirements

| **\#** | **Requirement**                                                                                                                                                                                                                                                                               |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A2.1   | Triggered two ways: from a solved question via an "explore this topic" control shown only where the topic has a supported layout type, or directly from topic search on the Atlas tab.                                                                                                        |
| A2.2   | Four layout types only: geographic map, chronological timeline, labelled cutaway, process or cycle flow. If none fits, Atlas declines and offers the standard explanation instead.                                                                                                            |
| A2.3   | Click-through depth is exactly two levels. A node opens a detail panel; a panel may contain up to four linked nodes. No infinite recursion, for cost and for coherence.                                                                                                                       |
| A2.4   | Every image element carries visible source attribution linking to the origin. Images come from an indexed library of openly licensed sources, primarily Wikimedia Commons, rather than being generated. Generated illustration is used only for schematic elements carrying no factual claim. |
| A2.5   | Worlds are generated once per syllabus topic and cached, never per student. A cached topic serves in under two seconds.                                                                                                                                                                       |
| A2.6   | The top 150 WAEC and JAMB history and biology topics by past-question frequency are pre-built and shipped warm. \[ASSUMPTION A8\] 150 is the estimated point where marginal topic frequency stops justifying the build cost. Validate against the bank.                                       |
| A2.7   | A world renders as SVG with progressive image loading, initial payload under 400KB.                                                                                                                                                                                                           |
| A2.8   | A student can save a world for offline viewing.                                                                                                                                                                                                                                               |
| A2.9   | Fresh generation for an uncached topic is queued, not synchronous, rate-limited per account, with notification on completion.                                                                                                                                                                 |

A2.4 and A2.5 together are the decision that makes the economics work. Generating bespoke raster art per student per topic is what would make this feature cost forty cents a world. Generating a structured SVG scene once per topic, populated with openly licensed sourced imagery, gives source traceability for free, cuts cost by roughly three quarters, produces a payload light enough for 3G, and removes most of the visual moderation problem, because you are not generating photorealistic imagery of people or events.

### A.3 Generation pipeline and cost

| **Stage**                     | **What it does**                                                                                                                            | **Cost USD** |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| A1. Classification and layout | Picks the layout type and produces a scene plan: node list, arrangement, and the factual claim each node carries                            | 0.020        |
| A2. Source retrieval          | Queries the indexed openly licensed library per node. Nodes with no acceptable source render as labelled schematic elements or are dropped. | ~0           |
| A3. Node content              | One batched call producing all detail panels, each capped at 80 words and constrained to claims the attached sources support                | 0.015        |
| A4. Scene assembly            | Generates the SVG structure with positioned nodes, labels and interaction targets                                                           | 0.020        |
| A5. Moderation and review     | Automated text and image check. History topics touching conflict, colonialism or religion route to human review before publication.         | 0.001        |
|                               | Total per world, plus human review time on sensitive topics                                                                                 | 0.056        |

Pre-building 150 topics costs under 10 dollars in compute. The real cost of Atlas is engineering time and review time, not inference, which is exactly why the decision to defer it is a focus decision rather than a cost decision.

### A.4 Additional surfaces if built

```text
/atlas                  topic search and browse
/atlas/[topicSlug]      a rendered world, statically generated per topic
```


The Atlas models in section 11 are already in the schema so the data shape is settled, but no Atlas table is written to in v1.

## Appendix B. Change Log, v0.1 to v0.2

Twenty three lapses were found in review. All twenty three are corrected here, ranked by severity.

| **\#** | **Lapse in v0.1**                                                                                                                                                      | **Correction in v0.2**                                                                                                                                                                                |
|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1      | The copyright gate was described as blocking everything and then scheduled around. Phase 1 built the past-question bank before the question was answered.              | Removed from the risk table. Now Phase 0 in 14.1, with owner, three priced options, a decision date and a hard rule that no data is ingested until it closes.                                         |
| 2      | Inference cost stated as about 40 USD at 5,000 MAU. Wrong by roughly thirty times.                                                                                     | Corrected to about 1,150 USD in 7.2, with the paragraph rewritten so inference is shown as the dominant cost.                                                                                         |
| 3      | The free tier quiz cap made the north star arithmetically unreachable: one quiz against five questions caps loop completion at 20 percent against a 45 percent target. | Quiz cap removed from every tier in 8.1 and F3.6. Cost impact of about ₦0.16 per quiz noted.                                                                                                          |
| 4      | No go-to-market, no CAC, no channel, behind a 100-subscriber exit criterion.                                                                                           | New section 9 with the signup arithmetic, four channels with budgets, CAC, payback, LTV and an owner. Acquisition budget added to burn in 14.0.                                                       |
| 5      | The Prisma schema did not compile, and four revenue-relevant models had no foreign keys.                                                                               | PastQuestion back-relation added. GuardianLink.studentId, UsageCounter.userId, AtlasView.userId and ModelCall.worldId converted to real relations with onDelete set. Validate and format added to CI. |
| 6      | Verification depended on a computer algebra system that does not exist in the locked Node stack.                                                                       | Named Python and SymPy service in 7.2, with latency and cost lines in 6.1, a degradation path in 6.2, a failure row in 6.4, a risk at R7 and a headcount line in 14.0.                                |
| 7      | No team size, skill mix or budget, so every duration was unfounded.                                                                                                    | New 14.0 with roles, headcount and a monthly burn of about ₦4.1m. All three phases re-derived and lengthened.                                                                                         |
| 8      | Accuracy, the top risk, had no owner. Its mitigation depended on a person who appeared nowhere.                                                                        | Content and accuracy owner named in 14.0 with a weekly benchmark review and a 48-hour flag turnaround. Referenced from the R1 mitigation.                                                             |
| 9      | Atlas contradicted itself across sections 1, 5, 8 and 13: sold in three places, cancelled in one, with a price attached.                                               | Scope note under the title. Atlas moved entirely to Appendix A with no v1 markers. Section 8 split into v1 pricing and an indicative, uncommitted Atlas tier.                                         |
| 10     | Assumption A6, usage overrun, was marked high risk and left off the risk register.                                                                                     | Added as R3 with a fair-use limit and an alert at ₦1,500 per user per month wired to UsageCounter.inferenceCostMicros.                                                                                |
| 11     | Parent summary was sold in the tier table and specified as optional.                                                                                                   | F1.5 and F6.5 promoted to Must.                                                                                                                                                                       |
| 12     | Key targets (45 percent, 4 percent, 8 per 1,000) were invented and presented as derived.                                                                               | Every target in sections 3 and 12 now marked derived or first-guess, and all three carried into section 13 as T1.                                                                                     |
| 13     | The three assumptions named as needing pre-build tests were not scheduled. Only A12 appeared.                                                                          | A1, A2, A6 and A12 all have a test, an owner and a date in section 13, and all appear in Phase 1 in 14.2.                                                                                             |
| 14     | Upload transport time was absent from the latency budget.                                                                                                              | Rewritten as a stage table in 6.3 including round trips and a 5-second upload. G3 restated from 12 to 14 seconds to match.                                                                            |
| 15     | Under-13 consent by OTP was trivially defeated and the document did not admit it. No DPO named.                                                                        | Section 7.6 rewritten: mechanism, known weakness, legal position tagged as A14, and a fallback. DPO responsibility named in 14.0.                                                                     |
| 16     | "v1" was never defined against the phases, making the Must markers and the non-goals unreadable.                                                                       | Defined in the scope note and in section 3 as the Phase 2 exit state. Non-goals restated with the phase at which each is revisited.                                                                   |
| 17     | Cheating signals were logged to a table that did not exist.                                                                                                            | IntegritySignal model added to section 11 with its own enum and indexes.                                                                                                                              |
| 18     | The escalation rate was missing from the blended cost calculation.                                                                                                     | Stated as A13 at 8 percent in 6.1, with the arithmetic shown and the sensitivity at 25 percent given.                                                                                                 |
| 19     | Plus was priced at ₦2,500, one naira above the Paystack flat-fee waiver.                                                                                               | Repriced to ₦2,499. Fee falls from ₦137 to ₦37 and monthly margin rises to ₦1,382, or 55 percent.                                                                                                     |
| 20     | The north star date (month six) and the Phase 3 exit date (week 30) disagreed.                                                                                         | Both now week 30.                                                                                                                                                                                     |
| 21     | Cache-served solutions had no audit link, so a bad cached answer could not be traced.                                                                                  | Solution.servedFromCache replaced with a cacheId relation to SolutionCache, with a back-relation and an index.                                                                                        |
| 22     | The performance budget measured JavaScript only, so KaTeX fonts slipped past it.                                                                                       | Rewritten in 7.3 as total transferred bytes per route, with a separate 40KB font budget and a KaTeX subsetting requirement.                                                                           |
| 23     | The 768 embedding dimension was hardcoded across the two largest tables with no migration note.                                                                        | Migration note added in 11.2 with a one engineer-week estimate.                                                                                                                                       |
