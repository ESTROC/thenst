import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── shared style tokens ──────────────────────────────────────────────────────

const BASE =
  'font-family:\'Helvetica Neue\',Arial,sans-serif;max-width:620px;margin:0 auto;background:#ffffff;color:#171b22;';
const HEADER_BG = '#171b22';
const ACCENT    = '#d95325';
const MUTED     = '#737a83';
const DIVIDER   = 'border:none;border-top:1px solid #e5e3db;margin:28px 0;';

function layout(inner: string): string {
  return `
<div style="${BASE}">
  <!-- Header -->
  <div style="background:${HEADER_BG};padding:28px 36px;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;font-family:'Georgia',serif;">
      The<em style="font-style:italic;font-weight:400;">NST</em>
    </span>
  </div>
  <!-- Body -->
  <div style="padding:36px 36px 28px;">
    ${inner}
  </div>
  <!-- Footer -->
  <div style="background:#f7f6f2;border-top:1px solid #e5e3db;padding:20px 36px;text-align:center;">
    <p style="margin:0 0 6px;font-size:11px;color:${MUTED};">
      TheNST · National Security Talent &amp; Research Network
    </p>
    <p style="margin:0 0 6px;font-size:11px;color:${MUTED};">
      <a href="https://thenst.co" style="color:${ACCENT};text-decoration:none;">thenst.co</a>
      &nbsp;·&nbsp;
      <a href="mailto:support@thenst.co" style="color:${ACCENT};text-decoration:none;">support@thenst.co</a>
    </p>
    <p style="margin:0;font-size:10px;color:#adb3ba;">
      This message was sent to you because you registered on TheNST platform.
      Please do not reply directly to this email.
    </p>
  </div>
</div>`;
}

function cta(label: string, url: string): string {
  return `
<div style="margin:28px 0;">
  <a href="${url}"
     style="display:inline-block;background:${ACCENT};color:#ffffff;
            padding:13px 28px;font-size:12px;font-weight:600;
            text-decoration:none;letter-spacing:0.06em;text-transform:uppercase;">
    ${label}
  </a>
</div>`;
}

function tag(label: string): string {
  return `<span style="display:inline-block;background:#fff3ee;border:1px solid #ffd5c4;
    color:${ACCENT};font-size:10px;font-weight:700;letter-spacing:0.08em;
    text-transform:uppercase;padding:2px 8px;margin-bottom:16px;">${label}</span>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 10px;font-size:24px;font-weight:600;
    color:#171b22;letter-spacing:-0.3px;line-height:1.3;">${text}</h1>`;
}

function p(text: string, extra = ''): string {
  return `<p style="margin:0 0 16px;font-size:13.5px;line-height:1.7;color:#2c3038;${extra}">${text}</p>`;
}

function ul(items: string[]): string {
  const lis = items
    .map(
      (item) =>
        `<li style="margin:0 0 10px;font-size:13.5px;line-height:1.6;color:#2c3038;">${item}</li>`
    )
    .join('\n');
  return `<ul style="margin:0 0 20px;padding-left:20px;">${lis}</ul>`;
}

function sectionHeading(text: string): string {
  return `<p style="margin:24px 0 10px;font-size:11px;font-weight:700;letter-spacing:0.1em;
    text-transform:uppercase;color:${MUTED};">${text}</p>`;
}

// ─── welcome templates ────────────────────────────────────────────────────────

function welcomeGuard(fullName: string): string {
  return layout(`
    ${tag('Security Professional')}
    ${h1(`Welcome to TheNST, ${fullName}.`)}
    ${p('Your registration is confirmed and your mobile number has been successfully verified. You now have a verified presence on India\'s dedicated national security talent network.')}
    <hr style="${DIVIDER}"/>
    ${p('TheNST was built for professionals like you — people who work in demanding, high-stakes environments and deserve a platform that takes their career as seriously as they do. This is not a generic job board. Every opportunity you will encounter here is sourced from verified organisations actively looking for security professionals with your credentials.')}
    ${sectionHeading('What you can do next')}
    ${ul([
      '<strong>Complete your KYC verification</strong> — Submit your identity documents and background details to activate your full profile. Verified profiles receive significantly more recruiter interest.',
      '<strong>Build your professional profile</strong> — Add your years of experience, specialisations, shift preferences, and availability status so the right opportunities find you.',
      '<strong>Browse active job postings</strong> — Explore open positions from verified employers across facility security, event protection, VIP assignments, and more.',
      '<strong>Set your availability</strong> — Let recruiters know you are actively looking so your profile surfaces at the top of relevant searches.',
    ])}
    <hr style="${DIVIDER}"/>
    ${p('Your profile is visible to HR managers and organisations the moment your KYC is approved. The process is straightforward and typically completed within 24–48 hours of submission.')}
    ${cta('Enter TheNST Platform', 'https://thenst.co/dashboard/guard')}
    ${p('If you have questions at any point, reach us at <a href="mailto:support@thenst.co" style="color:${ACCENT};">support@thenst.co</a>. We are here to support your career.', `color:${MUTED};font-size:12px;`)}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

function welcomePilot(fullName: string): string {
  return layout(`
    ${tag('Drone Pilot')}
    ${h1(`Welcome to TheNST, ${fullName}.`)}
    ${p('Your registration is confirmed and your mobile number has been successfully verified. You are now part of TheNST\'s verified network of aerial and counter-UAS field professionals.')}
    <hr style="${DIVIDER}"/>
    ${p('Drone pilots are among the most sought-after specialists in modern security operations. From aerial perimeter inspections and site mapping to counter-drone detection work, the demand for qualified, verified pilots is growing rapidly — and TheNST is where serious organisations come to find them.')}
    ${p('Your profile on TheNST gives you direct access to verified field missions, aerial security contracts, and defence-adjacent opportunities that are simply not available on general employment platforms.')}
    ${sectionHeading('What you can do next')}
    ${ul([
      '<strong>Complete your KYC verification</strong> — Verified pilots are prioritised in mission briefs and operator searches. Submit your documents to activate your full profile.',
      '<strong>List your certifications and equipment</strong> — Add your DGCA approvals, drone types, flight hours, and mission specialisations to stand out to contracting organisations.',
      '<strong>Browse aerial mission briefs</strong> — Explore active contracts for perimeter surveillance, thermal inspection, mapping, and counter-UAS operations.',
      '<strong>Set your operational availability</strong> — Indicate your location, deployment readiness, and preferred mission categories so the right briefs reach you.',
    ])}
    <hr style="${DIVIDER}"/>
    ${p('The security sector is increasingly reliant on aerial intelligence. Your skills are in demand, and this platform is built to connect them with the organisations that need them most.')}
    ${cta('Enter TheNST Platform', 'https://thenst.co/dashboard/guard')}
    ${p('For any queries, contact us at <a href="mailto:support@thenst.co" style="color:${ACCENT};">support@thenst.co</a>.', `color:${MUTED};font-size:12px;`)}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

function welcomeEducator(fullName: string): string {
  return layout(`
    ${tag('Educator')}
    ${h1(`Welcome to TheNST, ${fullName}.`)}
    ${p('Your registration is confirmed and your mobile number has been successfully verified. You now have a dedicated space on TheNST to build, teach, and certify the next generation of security professionals.')}
    <hr style="${DIVIDER}"/>
    ${p('Security education in India has long been fragmented — skills taught in isolation, certifications that do not travel across employers, and curricula disconnected from operational realities. TheNST exists to change that. As an educator on this platform, you are contributing to a structured, standards-driven approach to security training.')}
    ${p('Your courses, workshops, and materials will reach verified professionals actively seeking to advance their careers — practitioners who are serious about what they do, not casual browsers.')}
    ${sectionHeading('What you can do next')}
    ${ul([
      '<strong>Set up your educator profile</strong> — List your domain expertise, certifications, institutional affiliations, and teaching history so learners can find and trust you.',
      '<strong>Design and publish your first course</strong> — Use the TheNST curriculum tools to structure training modules, practical assessments, and certification pathways.',
      '<strong>Connect with security cohorts</strong> — Engage directly with verified security professionals and learners enrolled in your subject areas.',
      '<strong>Explore collaborative opportunities</strong> — Partner with organisations that need customised training programmes for their security teams.',
    ])}
    <hr style="${DIVIDER}"/>
    ${p('The professionals you train here go on to protect real people, real assets, and real infrastructure. The quality of your teaching matters — and TheNST is designed to give it the reach it deserves.')}
    ${cta('Enter TheNST Platform', 'https://thenst.co/platform')}
    ${p('Reach us at <a href="mailto:support@thenst.co" style="color:${ACCENT};">support@thenst.co</a> for any assistance getting started.', `color:${MUTED};font-size:12px;`)}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

function welcomeHR(fullName: string): string {
  return layout(`
    ${tag('Organisation')}
    ${h1(`Welcome to TheNST, ${fullName}.`)}
    ${p('Your registration is confirmed and your mobile number has been successfully verified. Your organisation now has access to TheNST\'s verified pool of security professionals, drone pilots, and specialised talent.')}
    <hr style="${DIVIDER}"/>
    ${p('Finding reliable security personnel is one of the most consequential hiring decisions an organisation makes. A gap in your security team is not just an operational problem — it is a risk exposure. TheNST was built to solve this with speed, rigour, and transparency.')}
    ${p('Every professional on this platform has been identity-verified and background-checked. You are not sifting through unvetted applications. You are selecting from a pre-qualified talent pool.')}
    ${sectionHeading('What you can do next')}
    ${ul([
      '<strong>Complete your organisation\'s KYC</strong> — Verified organisations unlock full access to candidate profiles, direct contact details, and the hiring request system. Submit your company documents to get started.',
      '<strong>Post your security requirements</strong> — Create a detailed job posting specifying the roles, locations, shift patterns, and qualifications you need.',
      '<strong>Browse and shortlist candidates</strong> — Search verified professionals by skill, experience, location, and availability. Use your credits to unlock full profiles and contact details.',
      '<strong>Send hiring requests</strong> — Reach out directly to candidates and agencies through the platform\'s structured hiring request system.',
    ])}
    <hr style="${DIVIDER}"/>
    ${p('Your account starts with complimentary credits to get you started. Additional credits can be purchased as your hiring needs scale. For bulk requirements, our agency partnerships can deploy teams rapidly.')}
    ${cta('Enter TheNST Platform', 'https://thenst.co/dashboard/hr')}
    ${p('Our team is available at <a href="mailto:support@thenst.co" style="color:${ACCENT};">support@thenst.co</a> to support your onboarding.', `color:${MUTED};font-size:12px;`)}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

function welcomeResearcher(fullName: string): string {
  return layout(`
    ${tag('Researcher')}
    ${h1(`Welcome to TheNST, ${fullName}.`)}
    ${p('Your registration is confirmed and your mobile number has been successfully verified. You now have a dedicated research presence on TheNST — India\'s professional network for defense, intelligence, and security scholarship.')}
    <hr style="${DIVIDER}"/>
    ${p('The gap between academic security research and operational application is wide. Most analysis produced in Indian institutions never reaches the practitioners who need it. TheNST is designed to close that gap — connecting researchers with verified professionals, organisations, and policy-adjacent stakeholders who can act on rigorous intelligence work.')}
    ${p('Whether your focus is cyber threat analysis, regional maritime security, critical infrastructure resilience, or AI-assisted threat detection, this platform gives your work the audience and the institutional weight it deserves.')}
    ${sectionHeading('What you can do next')}
    ${ul([
      '<strong>Build your researcher profile</strong> — List your areas of specialisation, institutional affiliations, published work, and ongoing research focus areas.',
      '<strong>Publish briefings and monographs</strong> — Submit peer-reviewed defense and intelligence monographs, threat assessments, and policy briefings through the TheNST research portal.',
      '<strong>Connect with commissioning organisations</strong> — Organisations on the platform actively seek research partnerships. Make your expertise visible to them.',
      '<strong>Access the verified professional network</strong> — Engage with security practitioners and drone operators whose field experience can inform and validate your research.',
    ])}
    <hr style="${DIVIDER}"/>
    ${p('Strong analysis shapes policy, informs procurement decisions, and ultimately protects people. The work you do here matters — and TheNST is committed to ensuring it reaches the right hands.')}
    ${cta('Enter TheNST Platform', 'https://thenst.co/platform')}
    ${p('For questions, reach us at <a href="mailto:support@thenst.co" style="color:${ACCENT};">support@thenst.co</a>.', `color:${MUTED};font-size:12px;`)}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

function welcomeLearner(fullName: string): string {
  return layout(`
    ${tag('Learner')}
    ${h1(`Welcome to TheNST, ${fullName}.`)}
    ${p('Your registration is confirmed and your mobile number has been successfully verified. You now have access to TheNST\'s structured learning environment — built for people who take security competencies seriously.')}
    <hr style="${DIVIDER}"/>
    ${p('Most online security courses are generic, dated, or disconnected from real employment pathways. TheNST is different. The training here is designed in collaboration with verified security practitioners, drone pilots, and industry educators — so what you learn maps directly to what the field actually requires.')}
    ${p('Whether you are building a career from the ground up, adding a specialisation to an existing profile, or preparing for a specific certification, this is the right environment to do it. You are learning alongside verified professionals in a network where skills translate to opportunities.')}
    ${sectionHeading('What you can do next')}
    ${ul([
      '<strong>Explore available courses</strong> — Browse structured learning modules across security guarding, drone operations, cyber safety, first aid, and more. Start with the track that aligns with your immediate goals.',
      '<strong>Complete your learner profile</strong> — Add your background, the skills you are working toward, and the certifications you are targeting. This helps match you with the most relevant content.',
      '<strong>Earn skill certificates</strong> — Courses on TheNST come with completion certificates that are recognised within the platform\'s professional network and by verified employers.',
      '<strong>Track your progress</strong> — Use your personal learning dashboard to monitor course completion, skill development, and certification milestones.',
    ])}
    <hr style="${DIVIDER}"/>
    ${p('Skills in security are not static. The threat landscape changes, technology evolves, and employers expect professionals who keep pace. TheNST is built to support your learning continuously — not just at the start.')}
    ${cta('Enter TheNST Platform', 'https://thenst.co/platform')}
    ${p('We are here to help at <a href="mailto:support@thenst.co" style="color:${ACCENT};">support@thenst.co</a> if you need guidance getting started.', `color:${MUTED};font-size:12px;`)}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

function welcomeAdmin(fullName: string): string {
  return layout(`
    ${tag('Administrator')}
    ${h1(`Admin Account Created`)}
    ${p(`Dear <strong>${fullName}</strong>,`)}
    ${p('An administrator account has been created for you on TheNST. You can sign in using your registered credentials. Please note that your account is currently pending verification by the Super Admin.')}
    <hr style="${DIVIDER}"/>
    ${p('You will receive a separate confirmation once your account has been reviewed and activated. After activation, you will have full access to the administrative dashboard.')}
    ${cta('Login to Your Account', 'https://thenst.co/login')}
    <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
  `);
}

// ─── route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let toEmail = 'unknown';
  let templateName = 'unknown';

  try {
    const body = await req.json();
    const { to, subject, template, data } = body;
    toEmail = to;
    templateName = template;

    if (!to || !subject || !template || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, template, or data' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('BREVO_API_KEY is not configured.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { fullName, role: rawRole, isAgency } = data;

    // ── role display names ──────────────────────────────────────────────────
    const roleDisplayMap: Record<string, string> = {
      guard:      'Security Professional',
      pilot:      'Drone Pilot',
      educator:   'Educator',
      hr:         'Organisation',
      researcher: 'Researcher',
      learner:    'Learner',
      admin:      'Administrator',
      superadmin: 'Super Admin',
      agency:     'Security Agency',
    };
    const roleDisplay = roleDisplayMap[rawRole] || rawRole;

    // ── build html ──────────────────────────────────────────────────────────
    let htmlContent = '';

    switch (template) {

      // ── WELCOME ────────────────────────────────────────────────────────────
      case 'welcome': {
        switch (rawRole) {
          case 'guard':
            htmlContent = welcomeGuard(fullName);
            break;
          case 'pilot':
            htmlContent = welcomePilot(fullName);
            break;
          case 'educator':
            htmlContent = welcomeEducator(fullName);
            break;
          case 'hr':
            htmlContent = welcomeHR(fullName);
            break;
          case 'researcher':
            htmlContent = welcomeResearcher(fullName);
            break;
          case 'learner':
            htmlContent = welcomeLearner(fullName);
            break;
          case 'admin':
            htmlContent = welcomeAdmin(fullName);
            break;
          default:
            htmlContent = layout(`
              ${h1(`Welcome to TheNST, ${fullName}.`)}
              ${p(`Thank you for registering as a <strong>${roleDisplay}</strong>. Your account has been created successfully.`)}
              ${cta('Enter TheNST Platform', 'https://thenst.co/platform')}
              <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
            `);
        }
        break;
      }

      // ── APPROVAL ───────────────────────────────────────────────────────────
      case 'approval': {
        if (rawRole === 'admin') {
          htmlContent = layout(`
            ${tag('Account Verified')}
            ${h1('Your Admin Account Has Been Approved')}
            ${p(`Dear <strong>${fullName}</strong>,`)}
            ${p('Your administrator account on <strong>TheNST</strong> has been verified and activated by the Super Admin. You now have full access to the administrative dashboard.')}
            ${cta('Login to Dashboard', 'https://thenst.co/login')}
            <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
          `);
        } else {
          const loginUrl = 'https://thenst.co/login';
          const approvalMessage =
            data.message ||
            (rawRole === 'hr'
              ? 'Your company verification has been approved. You can now access verified security professionals.'
              : rawRole === 'agency'
              ? 'Your Security Agency has been approved. You can now receive bulk hiring requests.'
              : `Your verification as a <strong>${roleDisplay}</strong> has been approved. You are now visible to verified employers.`);

          htmlContent = layout(`
            ${tag('Approved')}
            ${h1('Verification Approved')}
            ${p(`Hello <strong>${fullName}</strong>,`)}
            ${p(approvalMessage)}
            ${p('Log in to access all platform features.')}
            ${cta('Login to Dashboard', loginUrl)}
            <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
          `);
        }
        break;
      }

      // ── REJECTION ──────────────────────────────────────────────────────────
      case 'rejection': {
        htmlContent = layout(`
          ${tag('Verification Update')}
          ${h1('Verification Update')}
          ${p(`Hello <strong>${fullName}</strong>,`)}
          ${p(`We have reviewed your application for the <strong>${roleDisplay}</strong> role. Unfortunately, we are unable to approve it at this time.`)}
          ${data.reason ? p(`<strong>Reason:</strong> ${data.reason}`) : ''}
          ${p('If you believe this is an error or would like to update your details, please log in to your dashboard or contact support.')}
          ${cta('Login to Dashboard', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      // ── HIRED ──────────────────────────────────────────────────────────────
      case 'hired': {
        htmlContent = layout(`
          ${tag('New Hiring Request')}
          ${h1('You Have Received a Hiring Request')}
          ${p(`Dear <strong>${fullName}</strong>,`)}
          ${p('A recruiter has shown interest in your profile on <strong>TheNST</strong>.')}
          <div style="background:#f7f6f2;border:1px solid #e5e3db;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;font-size:13px;color:#2c3038;">
              <strong>Company:</strong> ${data.companyName}
            </p>
            <p style="margin:0;font-size:13px;color:#2c3038;">
              <strong>Recruiter:</strong> ${data.hrName}
            </p>
          </div>
          ${p('Log in to review the request and respond. Once accepted, you will be able to communicate directly with the recruiter through the platform.')}
          ${cta('Login to View Request', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      // ── ACCEPTANCE ────────────────────────────────────────────────────────
      case 'acceptance': {
        htmlContent = layout(`
          ${tag('Request Accepted')}
          ${h1('Your Hiring Request Was Accepted')}
          ${p(`Dear <strong>${fullName}</strong>,`)}
          ${p(`The ${isAgency ? 'security agency' : 'security professional'} you reached out to has accepted your hiring request.`)}
          <div style="background:#f7f6f2;border:1px solid #e5e3db;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;font-size:13px;color:#2c3038;">
              <strong>${isAgency ? 'Agency' : 'Candidate'}:</strong> ${data.candidateName}
            </p>
            ${isAgency && data.contactPerson ? `<p style="margin:0 0 6px;font-size:13px;color:#2c3038;"><strong>Contact Person:</strong> ${data.contactPerson}</p>` : ''}
            <p style="margin:0;font-size:13px;color:#2c3038;">
              <strong>Your Company:</strong> ${data.companyName}
            </p>
          </div>
          ${p(`You can now proceed to connect and communicate directly with the ${isAgency ? 'agency' : 'candidate'} through the platform.`)}
          ${cta('Login to Continue', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      // ── HIRING_REJECTION ──────────────────────────────────────────────────
      case 'hiring_rejection': {
        htmlContent = layout(`
          ${tag('Hiring Request Update')}
          ${h1('Hiring Request Update')}
          ${p(`Dear <strong>${fullName}</strong>,`)}
          ${p(`The ${isAgency ? 'security agency' : 'security professional'} you contacted has declined your hiring request.`)}
          <div style="background:#f7f6f2;border:1px solid #e5e3db;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;font-size:13px;color:#2c3038;">
              <strong>${isAgency ? 'Agency' : 'Candidate'}:</strong> ${data.candidateName}
            </p>
            ${isAgency && data.contactPerson ? `<p style="margin:0 0 6px;font-size:13px;color:#2c3038;"><strong>Contact Person:</strong> ${data.contactPerson}</p>` : ''}
          </div>
          ${p(`We encourage you to explore other verified ${isAgency ? 'agencies' : 'professionals'} available on the platform.`)}
          ${cta('Explore More Options', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      // ── HIRING_SUCCESS ────────────────────────────────────────────────────
      case 'hiring_success': {
        htmlContent = layout(`
          ${tag('Deal Finalised')}
          ${h1('Congratulations on the Successful Placement')}
          ${p(`Dear <strong>${fullName}</strong>,`)}
          ${p(`The ${isAgency ? 'partnership' : 'hiring'} with <strong>${data.companyName}</strong> has been officially confirmed through TheNST.`)}
          <div style="background:#f7f6f2;border:1px solid #e5e3db;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0 0 6px;font-size:13px;color:#2c3038;">
              <strong>Company:</strong> ${data.companyName}
            </p>
            <p style="margin:0 0 6px;font-size:13px;color:#2c3038;">
              <strong>Contact:</strong> ${data.hrName}
            </p>
            ${data.hrEmail ? `<p style="margin:0;font-size:13px;color:#2c3038;"><strong>Email:</strong> ${data.hrEmail}</p>` : ''}
          </div>
          ${p('Log in to view further details and manage next steps.')}
          ${cta('Login to Dashboard', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      // ── APPLICATION_ACCEPTED ──────────────────────────────────────────────
      case 'application_accepted': {
        htmlContent = layout(`
          ${tag('Application Shortlisted')}
          ${h1('Your Application Has Been Shortlisted')}
          ${p(`Dear <strong>${fullName}</strong>,`)}
          ${p(`Your application at <strong>${data.companyName}</strong> has been shortlisted. The recruiting team found your profile suitable and may reach out to you regarding next steps.`)}
          ${p('We encourage you to continue exploring and applying to other relevant opportunities on TheNST to maximise your prospects.')}
          ${cta('View Your Dashboard', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      // ── APPLICATION_RECEIVED ──────────────────────────────────────────────
      case 'application_received': {
        htmlContent = layout(`
          ${tag('Application Received')}
          ${h1('Application Submitted Successfully')}
          ${p(`Dear <strong>${fullName}</strong>,`)}
          ${p(`Thank you for applying at <strong>${data.companyName}</strong> through TheNST. Your application has been received and the recruiting team will review your profile.`)}
          ${p('In the meantime, continue exploring other open positions available on the platform.')}
          ${cta('Browse More Opportunities', 'https://thenst.co/login')}
          <p style="margin:0;font-size:13px;color:#2c3038;">Regards,<br/><strong>The TheNST Team</strong></p>
        `);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid template' },
          { status: 400 }
        );
    }

    // ── send via Brevo ──────────────────────────────────────────────────────
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL || 'noreply@thenst.co';

    const payload = {
      sender: { name: 'TheNST', email: senderEmail },
      to: [{ email: to.trim(), name: fullName ? fullName.trim() : 'User' }],
      subject,
      htmlContent,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Brevo API note:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData?.message || 'Failed to send email via Brevo',
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });

  } catch (error: any) {
    console.warn(
      `[Email Service Note] Template: ${templateName}, To: ${toEmail}, Details:`,
      error?.message || error
    );
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
