export const caseStudies = [
  {
    slug: "rebecca-everlene",
    company: "Rebecca Everlene Trust Company",
    period: "Oct 2025 – Present · Chicago, IL",
    role: "UX/UI Designer",
    titleLines: ["A gamified 0→1 platform", "for a B2C financial product."],
    tags: ["0→1 product", "Gamified learning", "AI workflows", "B2C"],
    metrics: [["25%", "Task completion increase"], ["40%", "Early drop-off reduction"], ["50%", "Faster time-to-prototype"], ["10+", "AI-automated features"]],
    overview: "Leading design end to end: discovery, wireframing, prototyping, and high-fidelity execution, for a B2C web platform that turns dense financial education into a gamified learning journey people actually finish.",
    confidential: true,
    chapters: [
      { label: "Discovery", title: "Dense content, rewritten as a journey.", skim: "Audited the whole content library and rebuilt it as progressive modules with a visible beginning, middle, and end.", body: "The product's knowledge base was accurate but exhausting: long pages, no sense of progress, no reason to return. The first move was structural, auditing the full content library and rebuilding it as progressive learning modules with a clear beginning, middle, and end, so users always know where they are and what's next." },
      { label: "System", title: "Gamification that serves comprehension.", skim: "Progress mechanics designed around learning outcomes, not decoration: task completion up 25%, early drop-off down 40%.", body: "Progress mechanics, staged challenges, and completion states were designed around learning outcomes rather than decoration. The restructured modules lifted task completion by 25% and cut early-stage drop-off by 40%; the game layer works because the information architecture underneath it is sound." },
      { label: "Craft", title: "AI-accelerated, design-led.", skim: "AI-automated workflows across 10+ features halved time-to-prototype without losing system coherence.", body: "AI-automated design workflows across 10+ features compressed time-to-prototype by 50% without giving up fidelity or system coherence. Technical constraints were flagged with engineering during early wireframing, avoiding two late-stage redesigns before anything shipped." },
    ],
  },
  {
    slug: "eye-ai",
    company: "Onward Technologies · EYE AI",
    period: "Jul 2024 – Aug 2024 · Chicago, IL",
    role: "UX/UI Designer",
    titleLines: ["Retinal Diagnostic Platform"],
    tags: ["Predictive AI", "Human-Centered Design", "Design Systems"],
    metrics: [["20%", "Faster diagnostic tasks"], ["10→7", "Week MVP timeline"], ["5", "Severity issues eliminated"], ["15+", "Stakeholder workshops"]],
    overview: "This project at Onward Technologies focused on designing a comprehensive digital solution for retina specialists and technicians who faced fragmented workflows across patient data, image analysis, and diagnosis. As Product & Interaction Designer, I designed a centralized web portal integrating three core functions, patient data management, AI-assisted image analysis, and diagnostic report generation, aimed at building efficiency, accuracy, and confidence in diagnostics using a GenAI-powered platform.",
    /* Hero media: content/eye-ai-content.md calls for a video here, but no
       video asset exists in the codebase yet — rendered as an explicit,
       genuinely-empty placeholder (see cs-video-placeholder in
       CaseStudyPage.js) rather than skipped outright, per instruction. */
    heroVideoPlaceholder: true,
    /* Fixed-taxonomy section content (drives the CaseStudyTOC sidebar +
       CaseStudySection rendering below), sourced from
       "info content/eye-ai-content.md". This REPLACES the freeform
       `chapters` rendering for this one case study only — the other case
       studies still use `chapters` untouched, exactly as before.

       "Challenges & Constraints" and "Next Steps" are omitted: the source
       content has no material for either, and per instruction empty
       sections shouldn't get a nav entry rather than being stubbed out. */
    sections: [
      {
        id: "problem-statement",
        navLabel: "Problem Statement",
        paragraphs: [
          "How can a technology-based solution enable retina specialists and technicians to efficiently manage patient data, analyze retinal imagery, and deliver accurate diagnostics, while maintaining usability, clarity, and trust in high-stakes medical environments?",
        ],
      },
      {
        id: "research-insights",
        navLabel: "Research & Key Insights",
        paragraphs: [
          "To ground our solution in reality, we mapped AI's role within retinopathy diagnostics. Our domain scan revealed how AI supports image analysis, patient data review, predictive modeling, and task automation, yet also exposed key gaps in workflow efficiency, clinician trust, and the practical meaning of “usable” AI in clinical environments.",
          "These insights informed our strategic direction, with insights into user pain points, needs, and expectations guiding feature prioritization that supports the user's workflow rather than replacing it entirely.",
        ],
        imagePlaceholders: [
          "User research, key insights & journey mapping",
          null,
          null,
          null,
        ],
      },
      {
        id: "my-role",
        navLabel: "My Role",
        bullets: [
          "Competitive analysis on current GenAI applications in MedTech for viable integration.",
          "Designing workflows to streamline data management and reduce task load for healthcare professionals.",
          "Maintaining consistent documentation and brand alignment through evolving design stages.",
        ],
      },
      {
        id: "approach-process",
        navLabel: "Approach / Process",
        subsections: [
          {
            heading: "Early Designs",
            paragraphs: [
              "Early iterations focused on aligning the user flow and overall experience with project goals. Through multiple design cycles, integrating developer feedback and stakeholder reviews, we crafted the solution to strengthen both business objectives and the end-user experience.",
            ],
            imagePlaceholders: [null],
          },
          {
            heading: "AI Model",
            paragraphs: [
              "The AI-powered retinal analysis system processes uploaded fundus images through a deep learning pipeline for real-time disease detection. Images are first preprocessed and passed into a ResNet50-based model that extracts key retinal features and performs multi-task classification for diabetic retinopathy and macular edema. The system provides immediate severity assessments, generates visual overlays to explain predictions, and allows clinicians to confirm results for final reporting. All analyses are securely stored, enabling patient history tracking and streamlined diagnostic workflows.",
            ],
            imagePlaceholders: [null],
          },
        ],
      },
      {
        id: "final-design",
        navLabel: "Final Design / Solution",
        paragraphs: ["A look at the finished interface."],
        images: [
          ["onward-1.png", "Onward's EYE AI product site hero: “Enhance your practice with AI technology.”", "The site clinicians land on first"],
          ["eyeai-cover.png", "Eye AI clinician dashboard listing patients with diagnostic status and images analyzed.", "Patient dashboard: status and diagnostic queue at a glance"],
        ],
        imagePlaceholders: Array(7).fill(null),
      },
      {
        id: "outcomes-impact",
        navLabel: "Outcomes / Impact",
        bullets: [
          "Reducing diagnostic time by 40% through real-time AI-assisted retinal image analysis, cutting manual effort and evaluation from 10 minutes to under 4 minutes.",
          "Improving diagnostic accuracy by 15%, supporting retina specialists in early detection of diabetic retinopathy and macular edema with multi-task deep learning.",
          "Enhancing clinical efficiency and adoption by providing secure history tracking, automated PDF reporting, and explainable visual overlays.",
        ],
        imagePlaceholders: Array(4).fill(null),
      },
      {
        id: "takeaways",
        navLabel: "What I Took Away",
        bullets: [
          "Bridging AI & UX — within tight deadlines, I learned how to integrate a multi-task deep learning model into a user-friendly, clinician-focused web interface.",
          "Iterative problem-solving — I realized that small improvements, like visual overlays and report automation, had a huge impact on adoption and real-world efficiency.",
          "Collaboration & scalability — learned to balance visual quality with performance, knowing when to push for better design and when to prioritize scalability.",
        ],
      },
    ],
    /* Superseded by `sections` above (fixed-taxonomy content from
       info content/eye-ai-content.md) — CaseStudyPage renders `sections`
       instead of `chapters` whenever a study provides one. Left as an
       empty array (rather than removed) so `study.chapters.length` stays
       safe wherever the page still reads it generically. */
    chapters: [],
  },
  {
    slug: "optrahealth",
    company: "OptraHealth",
    period: "Dec 2024 – Mar 2025 · San Jose, CA",
    role: "Product + UI/UX Designer",
    titleLines: ["Pediatric Therapy App", "for patients, parents, and providers."],
    tags: ["Gamification", "Visual Engagement", "Design Psychology"],
    metrics: [["30%", "Weekly engagement increase"], ["28%", "Tutorial completion increase"], ["100+", "Component Figma library"], ["20+", "Usability sessions"]],
    overview: "MyoCircle is a youth-centric healthcare platform designed to simplify appointment scheduling, medication tracking, and physical activity management.",
    /* Reuses the same cover-image mechanism travelogue already has (Wipe,
       rendered right after Overview) rather than a separate hero-image
       field — info content/myocircle-content.md's hero media marker is an
       image, not a video, and this cover already exists in the codebase
       (used on the homepage teaser) but wasn't yet shown on this page. */
    cover: ["myocircle-cover.png", "MyoCircle mobile app across two phones, an AI-companion health app with achievement badges and a gamified exercise flow."],
    /* Fixed-taxonomy section content, sourced from
       "info content/myocircle-content.md". Supersedes the freeform
       `chapters` below for this study, same as eye-ai. "Research & Key
       Insights" and "Final Design / Solution" have no matching prose in
       that file, but do have real, already-existing case-study images
       that need a home now that `chapters` is retired — reused the
       EXISTING chapter copy that already covered that ground (validation
       research, and the finished-product screens) rather than writing
       anything new. "Outcomes / Impact" is omitted: its only concrete
       figure (60% conversion) is folded into Challenges below, and the
       rest is already the metrics band above. */
    sections: [
      {
        id: "problem-statement",
        navLabel: "Problem Statement",
        paragraphs: [
          "How can a technology-based solution enable users to independently manage their healthcare routines, making it an intuitive, engaging, and age-appropriate experience for younger patients?",
        ],
      },
      {
        id: "research-insights",
        navLabel: "Research & Key Insights",
        paragraphs: [
          "Twenty-plus usability testing and heuristic evaluation sessions across all three user groups (patients, parents, and providers) surfaced where onboarding lost people, cutting drop-off among parents by 20% and grounding every major flow in observed behaviour.",
        ],
      },
      {
        id: "my-role",
        navLabel: "My Role",
        paragraphs: [
          "With full creative ownership of end-to-end visual design, I worked with 1 Product Manager and Software Engineers to conceptualize this product 0→1, designing intuitive user flows, gamified routines, and visual storytelling elements supporting interaction between doctors and patients, enabling children as young as 10 to independently manage their care through engaging, human-centered design.",
        ],
      },
      {
        id: "approach-process",
        navLabel: "Approach / Process",
        paragraphs: [
          "With the user group defined and research insights in place, the Empathize and Define stages had set a clear foundation. We transitioned into the Ideation phase, translating user needs into initial sketches, low-fidelity wireframes, and interaction concepts that balanced simplicity, playfulness, and usability.",
        ],
        imagePlaceholders: [null, null],
        subsections: [
          {
            heading: "Design Principles that Shaped the Experience",
            images: [
              ["myocircle-profile.png", "MyoCircle profile screen with streak, daily score, league, XP, and a monthly badges and achievements grid.", "Componentized: profile, badges, and progress states"],
            ],
          },
          {
            heading: "Designing for the Patient",
            images: [
              ["myocircle-day1.png", "MyoCircle Day 1 exercise screen with a guided video, sets and reps tracking, and a Start Exercise button.", "Where a session starts: guided video, sets, and reps"],
              ["myocircle-interaction.png", "MyoCircle exercise screen with Zoe's congratulations card after a completed exercise, awarding points.", "Where it ends: Zoe's encouragement moment"],
            ],
            imagePlaceholders: [null, null],
          },
        ],
      },
      {
        id: "challenges-constraints",
        navLabel: "Challenges & Constraints",
        paragraphs: [
          "We operated under tight timelines and a multi-platform scope, making cross-functional team alignment challenging. To accelerate decisions, we ran weekly structured design reviews with a shared decision log for heuristic passes, accessibility checks, and clinician sign-offs, resulting in a 60% conversion.",
        ],
      },
      {
        id: "final-design",
        navLabel: "Final Design / Solution",
        paragraphs: ["A look at the finished interface."],
        images: [
          ["myocircle-level13.png", "MyoCircle workout progress screen showing Level 13, 25% progress, and the Day 1 exercise video queue.", "What sessions validated: level progress and the exercise queue"],
        ],
        imagePlaceholders: [null, null, null],
      },
      {
        id: "takeaways",
        navLabel: "What I Took Away",
        bullets: [
          "Designing for Dual Roles (Patient & Clinician) — modeling shared objects/states before role-specific flows clarified permissions, reduced rework, and made handoffs predictable across surfaces.",
          "Designing for a Niche — designing for a new pediatric niche meant letting the rules lead. I treated the guideline stack as a blueprint for iterations, testing with quick feedback loops. These ‘constraints’ helped speed decisions and make the overall user experience clear, compliant and efficient/consistent.",
          "Design System First Approach — tokens (type, color, spacing), reusable components, and usage notes (kid vs clinician context) sped up iteration and kept UX consistent.",
        ],
      },
      {
        id: "next-steps",
        navLabel: "Next Steps",
        paragraphs: [
          "We observe what resonates, and keep only what sticks. It's crucial to smooth the rough edges on the Patient path while the Clinician experience comes to life, starting with the most critical jobs and handoffs. The aim is a coordinated pilotable release where progress, feedback, and guidance move seamlessly across roles, boosting adherence and shortening time-to-support, while the Clinician track (already scoped and partially explored) matures into a production-ready module.",
        ],
      },
    ],
    /* Superseded by `sections` above — see that field's comment. */
    chapters: [],
  },
  {
    slug: "travelogue",
    company: "Travelogue · personal case study",
    period: "Personal project · 2025",
    role: "Product Designer",
    titleLines: ["One home", "for every trip."],
    tags: ["Social Experience Design", "Information Architecture", "Visual Storytelling"],
    /* NOTE: info content/travelogue-content.md's Research section says "11
       participants (aged 18-35)"; this metric (below) and the existing
       research image's caption both say eight. Left the existing "08" here
       since it's an already-published number (this page's own metrics
       band, and the homepage teaser card), but the new Research section
       text below is transcribed faithfully from the source file as given —
       flagging the mismatch rather than silently picking one. */
    metrics: [["08", "Traveler interviews"], ["05", "Unmet needs mapped"]],
    overview: "Travelogue is a mobile-first travel app designed to simplify trip planning and enhance the travel experience. The platform enables real-time collaborative planning, social storytelling, and gamification to keep users engaged. With features like curated experiences and offline access, the app makes both solo and group travel more seamless, social, and rewarding.",
    cover: ["travelogue-cover.png", "Travelogue home feed and a group trip hub shown side by side on two phones."],
    /* Fixed-taxonomy section content, sourced from
       "info content/travelogue-content.md". Supersedes `chapters` below,
       same as eye-ai and myocircle. "Challenges & Constraints" has no
       matching prose in that file, but the existing "Field note" chapter
       (already-published copy, not new) covers exactly that ground — reused
       verbatim rather than leaving the section out or inventing something
       new. "Outcomes / Impact" and "Next Steps" are omitted: no source
       content for either. */
    sections: [
      {
        id: "problem-statement",
        navLabel: "Problem Statement",
        paragraphs: [
          "How can a technology-based solution enable users to collaboratively plan itineraries and share experiences in real time, while leveraging offline accessibility and gamified rewards to motivate exploration without feeling intrusive?",
        ],
      },
      {
        id: "research-insights",
        navLabel: "Research & Key Insights",
        subsections: [
          {
            heading: "Unified features = Smooth Execution",
            paragraphs: [
              "We conducted user interviews with 11 participants (aged 18-35) within our target demographic who were frequent users of multiple travel apps. The interview was aimed at uncovering major pain points and emotions felt through the process of executing a whole trip, solo or group.",
            ],
            images: [
              ["travelogue-research.png", "Research board of eight traveler quotes covering offline maps, one-stop planning, group coordination and expense tracking.", "Research synthesis: traveler interviews"],
            ],
          },
        ],
      },
      {
        id: "my-role",
        navLabel: "My Role",
        bullets: [
          "Collaborated with a multidisciplinary design team to create solutions that streamlined collaborative planning and enhanced user engagement, aiming to make the trip-planning experience user intuitive.",
          "Took the lead on crafting the Branding Guide and Design System.",
        ],
      },
      {
        id: "approach-process",
        navLabel: "Approach / Process",
        subsections: [
          {
            heading: "Competition vs Focus",
            paragraphs: [
              "Initial research revealed several existing players in the travel app space. However, the majority of these tools prioritize itinerary cataloging or travel journaling in isolation, often neglecting the collaborative and social aspects that make travel inherently shared and interactive.",
            ],
            bullets: [
              "Real-time itinerary collaboration",
              "Storytelling and social interaction",
              "Offline accessibility for maps and travel content",
            ],
          },
          {
            heading: "Designing Travelogue",
            paragraphs: [
              "The goal with Travelogue wasn't to replicate the entire travel ecosystem, but rather to refine the most collaborative and often chaotic part of the journey: trip planning and coordination. Rather than overcrowding the platform with booking engines or external hotel listings, we chose to prioritize clarity and usability by focusing on real user frustrations, the difficulty of getting everyone on the same page, the lack of offline access during travel, and the absence of a fun yet functional space to co-plan trips.",
            ],
            images: [
              ["travelogue-login.png", "Travelogue sign-in screen with the compass mark and social sign-in options.", "Entry point: sign up, log in, or connect socials"],
              ["travelogue-tripdetail.png", "Travelogue trip detail screen showing people, a locations map, itinerary hub, documents, trip planner, and gallery.", "Trip hub: people, route, itinerary, documents, gallery"],
            ],
          },
          {
            heading: "Smart Suggestions That Simplify Planning",
            bullets: [
              "A personal travel journal for eternity",
              "Centralized details, no delays",
            ],
            videoPlaceholder: true,
            imagePlaceholders: [null, null, null],
          },
        ],
      },
      {
        id: "challenges-constraints",
        navLabel: "Challenges & Constraints",
        paragraphs: [
          "The compass states it plainly: travel tools are used outdoors, one-handed, in bad light. Contrast, large touch targets, and glanceable typography were non-negotiable constraints, not polish.",
        ],
        images: [
          ["travelogue-compass.png", "A phone compass app held in hand inside a dim car, reading 186 degrees south.", "Field constraint: used one-handed, in motion"],
        ],
      },
      {
        id: "final-design",
        navLabel: "Final Design / Solution",
        paragraphs: ["Travelogue visuals: the finished interface."],
        images: [
          ["travelogue-home.png", "Travelogue home feed with greeting, solo trip countdown, upcoming trips carousel and nearby cafés.", "Home: countdown, upcoming trips, nearby"],
          ["travelogue-feed.png", "Travelogue home feed variant with trip countdown, weather, and wishlist suggestions.", "Feed: contextual suggestions and wishlist"],
          ["travelogue-phones.png", "Travelogue home feed and an upcoming trips list shown side by side on two phones.", "Home feed and upcoming trips, side by side"],
        ],
        imagePlaceholders: [null, null],
      },
      {
        id: "takeaways",
        navLabel: "What I Took Away",
        bullets: [
          "Effort Compounds Through Iteration — from usability testing to feature trade-offs, consistent collective effort and feedback cycles are what ultimately drove this product toward maturity.",
          "Inclusive Design is Never ‘Done’ — our research surfaced the need for stronger accessibility and localization, a reminder that global usability is an evolving, iterative responsibility.",
          "Team Effort — iterating on the workflows required tight coordination between design, research, and testing, proving how aligned teamwork can elevate first-time user experience.",
        ],
      },
    ],
    /* Superseded by `sections` above — see that field's comment. */
    chapters: [],
  },
  {
    slug: "dab-of-india",
    company: "DAB of India",
    period: "Jan 2023 – Aug 2023 · Pune, India",
    role: "Visual Designer",
    titleLines: ["Brand at scale", "across a client roster."],
    tags: ["Brand design", "AI-assisted workflow", "Client work"],
    metrics: [["25+", "Clients served"], ["1,000+", "Assets maintained"], ["5+", "New client wins"]],
    overview: "A production design practice built around consistency: an AI-assisted workflow spanning copy, mockups, and social and print assets across 25+ clients, without letting brand standards slip on any of them.",
    chapters: [
      { label: "Workflow", title: "An AI-assisted production pipeline.", skim: "A repeatable copy → mockup → asset pipeline with AI between human checkpoints.", body: "Built a repeatable workflow that moved from copy to mockups to finished social and print assets with AI tooling doing the heavy lifting between checkpoints, freeing time for the judgement calls that actually separate good brand work from generated noise." },
      { label: "Consistency", title: "1,000+ assets, one standard.", skim: "Templates, tokens, and review gates are what made volume and consistency compatible.", body: "Maintained brand standards across more than a thousand assets and twenty-five concurrent clients. The system (templates, tokens, and review gates) is what made volume and consistency compatible." },
      { label: "Growth", title: "Design that won business.", skim: "Pitch decks that contributed directly to five or more new client wins.", body: "Designed the brand pitch decks used directly in client acquisition, contributing to five or more new client wins: proof that production craft and business outcomes are the same conversation." },
    ],
  },
];
