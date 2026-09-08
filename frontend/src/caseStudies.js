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
    role: "Product Designer",
    // TODO(Eshani): titleLines below reflect your new "Pediatric Therapy App" /
    // "Companion-Guided App Connecting Patients, Parents & Providers" naming;
    // the 3 checklist bullets you sent were duplicates of the Onward ones, so
    // this overview still runs on the original Zoe-focused copy until you send
    // OptraHealth-specific highlights.
    titleLines: ["Pediatric Therapy App", "for patients, parents, and providers."],
    tags: ["AI companion", "Healthcare SaaS", "Design system"],
    metrics: [["30%", "Weekly engagement increase"], ["28%", "Tutorial completion increase"], ["100+", "Component Figma library"], ["20+", "Usability sessions"]],
    overview: "A companion-guided app connecting patients, parents, and providers. Primary designer for Zoe, an AI companion inside the MyoCircle health-tech SaaS platform, plus mobile onboarding, a patient management dashboard, and provider monitoring, validated across 20+ sessions with patients, parents, and providers.",
    chapters: [
      { label: "Interaction", title: "Designing an AI companion from the ground up.", skim: "Mapped Zoe's interaction model to real care touch-points so encouragement landed as timely, not noisy.", body: "Zoe's interaction layer was built from zero: mapping interaction models to user inputs and care touch-points so encouragement felt timely rather than noisy. The work lifted exercise tutorial completion by 28% and weekly engagement by 30%.", images: [
        ["myocircle-day1.png", "MyoCircle Day 1 exercise screen with a guided video, sets and reps tracking, and a Start Exercise button.", "Where a session starts: guided video, sets, and reps"],
        ["myocircle-interaction.png", "MyoCircle exercise screen with Zoe's congratulations card after a completed exercise, awarding points.", "Where it ends: Zoe's encouragement moment"],
      ] },
      { label: "System", title: "A library the whole team could build with.", skim: "A 100+ component Figma library PMs and engineers prototyped with on their own.", body: "A 100+ component Figma library became the shared language of the product team, adopted by product managers and engineers for independent prototyping, which kept design quality consistent even when design wasn't in the room. Profile, badges, and progress components are one small slice of it.", images: [
        ["myocircle-profile.png", "MyoCircle profile screen with streak, daily score, league, XP, and a monthly badges and achievements grid.", "Componentized: profile, badges, and progress states"],
      ] },
      { label: "Validation", title: "Tested with patients, parents, and providers.", skim: "20+ sessions across three user groups; parent onboarding drop-off fell 20%.", body: "Twenty-plus usability testing and heuristic evaluation sessions across all three user groups surfaced where onboarding lost people, cutting drop-off among parents by 20% and grounding every major flow in observed behaviour.", images: [
        ["myocircle-level13.png", "MyoCircle workout progress screen showing Level 13, 25% progress, and the Day 1 exercise video queue.", "What sessions validated: level progress and the exercise queue"],
      ] },
    ],
  },
  {
    slug: "travelogue",
    company: "Travelogue · personal case study",
    period: "Personal project · 2025",
    role: "Product Designer",
    // TODO(Eshani): your notes marked this project's title, subtitle, and 3
    // checklist bullets as "I will input info here" — replace titleLines and
    // overview below once you've written that copy.
    titleLines: ["One home", "for every trip."],
    tags: ["Personal project", "Mobile UX", "Research-led"],
    metrics: [["08", "Traveler interviews"], ["05", "Unmet needs mapped"]],
    overview: "Trip planning lives scattered across notes, maps, documents, and group chats. Travelogue is a self-initiated concept that consolidates it all, upcoming trips, itineraries, documents, and the people coming along, into one calm mobile home.",
    cover: ["travelogue-cover.png", "Travelogue home feed and a group trip hub shown side by side on two phones."],
    chapters: [
      { label: "Research", title: "What travelers actually ask for.", skim: "Eight interviews produced five unmet needs, every feature in the concept traces back to one of them.", body: "Informal interviews with travelers surfaced a consistent set of unmet needs: offline access for places without internet, one-stop consolidation of bookings and plans, easier group coordination, expense tracking, and a way to document trips as they happen. Every feature in the concept traces back to one of these quotes.", images: [
        ["travelogue-research.png", "Research board of eight traveler quotes covering offline maps, one-stop planning, group coordination and expense tracking.", "Research synthesis: eight traveler interviews"],
      ] },
      { label: "Concept", title: "A trip hub, not another list app.", skim: "Each trip becomes one hub: people, route, itinerary, documents, gallery.", body: "Each trip becomes a hub: the people coming, the locations on a map, an itinerary nexus with dates and details, documents one tap away, and a shared gallery. Group trips stop living in chat threads; everyone sees the same plan.", images: [
        ["travelogue-login.png", "Travelogue sign-in screen with the compass mark and social sign-in options.", "Entry point: sign up, log in, or connect socials"],
        ["travelogue-tripdetail.png", "Travelogue trip detail screen showing people, a locations map, itinerary hub, documents, trip planner, and gallery.", "Trip hub: people, route, itinerary, documents, gallery"],
      ], phone: true },
      { label: "Interface", title: "Calm, glanceable, travel-ready.", skim: "Home opens on a countdown and contextual nudges rather than an empty search field.", body: "The home feed opens with a countdown to the next trip, upcoming trip cards with ratings and reviews, and contextual nudges: nearby cafés in the morning, wishlist check-offs in the afternoon. A deep-green palette and large imagery keep it feeling like travel, not admin.", images: [
        ["travelogue-home.png", "Travelogue home feed with greeting, solo trip countdown, upcoming trips carousel and nearby cafés.", "Home: countdown, upcoming trips, nearby"],
        ["travelogue-feed.png", "Travelogue home feed variant with trip countdown, weather, and wishlist suggestions.", "Feed: contextual suggestions and wishlist"],
      ], phone: true },
      { label: "Field note", title: "Designed for the road.", skim: "Outdoors, one-handed, bad light: contrast and touch targets were constraints, not polish.", body: "The compass states it plainly: travel tools are used outdoors, one-handed, in bad light. Contrast, large touch targets, and glanceable typography were non-negotiable constraints, not polish.", images: [
        ["travelogue-compass.png", "A phone compass app held in hand inside a dim car, reading 186 degrees south.", "Field constraint: used one-handed, in motion"],
      ] },
    ],
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
