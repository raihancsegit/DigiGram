# DigiGram Project Audit Matrix

Last updated: 2026-06-04

This file is the working audit for what is already implemented, what is partial, and what should be fixed next. It is meant to stop repeating already-built roadmap items and keep the next work focused.

## Status Legend

- Done: Feature has a route/UI/service/schema path and can be tested end to end.
- Partial: Core exists, but missing polish, permissions, links, demo data, or one side of the workflow.
- Risk: Feature exists but has security, UX, data, or operational risk before production.
- Next: Recommended next action.

## Citizen And Household

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Household entry and member data | Done | `WardHouseholdManager`, `HouseholdEntryForm`, `householdService` | Mobile form still needs repeated real-device polish after each UI change | Keep as smoke-test item for mobile |
| Household edit scope | Done / Risk | `lib/utils/householdPermissions.js`, `database/58_household_edit_scope_hardening.sql` | Client-side checks exist; DB/RLS must be confirmed in Supabase for every mutation path | Add a permission test checklist and verify direct API/db writes |
| Volunteer village-only workflow | Done / Partial | `volunteer/dashboard`, `WardHouseholdManager` volunteer mode | Legacy households without `location_village_id` can still confuse access | Use maintenance audit until missing village mapping is zero |
| Household locker and documents | Done / Partial | `/h/[id]`, `household_documents`, private migration tooling | Some documents may still be old public path | Finish migration audit and document upload smoke test |
| Household priority/completeness | Done | `UnionCitizenQualityDashboard`, `getCitizenQualityDashboardByUnion` | Needs faster officer entry points from ward dashboard | Link priority cards to exact household edit modal |
| Women support desk | Done | `UnionCitizenQualityDashboard` | Case categories could be clearer for real union office users | Add category labels and filtering by widow/maternity/training/health |
| Tax and receipt | Done / Partial | `UnionTaxDashboard`, `TaxReceipt`, `/tax-receipt/[id]` | Needs payment workflow polish and receipt print QA | Add receipt print/mobile preview QA |

## Citizen Center

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Citizen inbox with OTP | Done | `/citizen`, `/api/citizen/otp`, `/api/citizen/inbox` | UI is rich but long; mobile task-first layout can improve | Split citizen page into compact mobile cards/tabs |
| Complaints | Done | `/api/citizen/complaints`, `CitizenComplaintManager` | Officer status update should always queue citizen SMS if wallet exists | Verify all status changes call SMS notify |
| Office appointment/serial | Done | `/api/citizen/appointments`, `CitizenAppointmentManager` | Needs daily schedule/slot capacity controls | Add office capacity and per-day queue filters |
| Life support cases | Done | `/api/citizen/life-support`, `CitizenLifeSupportManager` | Needs clearer case type presets | Add presets for document/help desk/women/elderly/health |
| Blood request | Done / Partial | `/api/citizen/blood`, blood services | Donor matching and SMS flow needs end-to-end field test | Add blood request smoke test to maintenance checklist |

## Officer Portals

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Chairman daily workboard | Done | `chairman/dashboard`, `OfficerActionCenter` | Workboard items should deep-link to exact tab/filter | Add `href` or `onSelect` targets for each task |
| Ward member daily workboard | Done | `ward-member/dashboard`, `OfficerActionCenter` | Same deep-link issue | Add task routing to household/service/sms tabs |
| Union citizen quality dashboard | Done | `UnionCitizenQualityDashboard` | Mobile density can improve | Compact cards for small screens |
| Ward/union responsive dashboards | Partial | Dashboards exist | Some heavy sections still overflow on mobile | Run browser mobile QA and patch obvious overflow |
| Maintenance readiness dashboard | Done | `/admin/maintenance`, `/api/admin/maintenance` | Bangla text encoding appears corrupted in several sections | Fix mojibake text in high-traffic UI files |

## SMS Business

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| SMS wallet/recharge/packages | Done | `/admin/sms`, `/api/sms/wallet`, `/api/sms/recharge`, `UnionSmsOutbox` | Need production gateway credentials and live provider test | Add provider config validation and test-send button |
| Gateway worker | Done | `/api/sms/process`, `smsProviderGateway`, `docs/sms_worker_setup.md` | Needs deployment cron setup in Vercel | Follow `docs/sms_worker_setup.md` in production |
| Business dashboard | Done / Partial | `/admin/sms`, `database/54_sms_business_insight_hardening.sql` | Should highlight revenue and low-balance owners more aggressively | Add revenue trend and low-balance follow-up CTA |
| Auto follow-up rules | Done as UI map | `SmsAutoFollowUpRules` | Some rules are documented/UI but not all automatic triggers are wired | Convert each rule to concrete trigger or mark as manual |
| Emergency broadcast | Partial | `UnionSmsOutbox`, SMS campaign API | Needs a dedicated emergency preset and confirmation workflow | Add emergency broadcast preset with ward/village targeting |

## Market / Hat Bazar

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Union and global market pages | Done | `UnionMarketView`, `GlobalMarketDashboard` | Design and menu polish can continue | Keep mobile visual QA |
| Market prices and manager portal | Done | `/admin/market`, `/market-manager`, `MarketManagement` | Price update table can be dense on phones | Add compact mobile price cards if needed |
| Price alerts | Done | `MarketPriceAlertSignup`, `/api/market/alerts` | Needs SMS delivery verification | Add test alert in SMS smoke test |
| Demand board | Done | `MarketDemandBoard`, `/api/market/demands` | Needs officer follow-up view/filters | Add demand queue to market admin panel |
| Market complaints | Done / Partial | `MarketUtilityHub`, `/api/market/complaints`, admin complaint panel | Route uses admin client; officer auth/scope should be hardened | Add auth/scope guard for GET/PATCH |
| Market utility hub | Done | `MarketUtilityHub` in union/global | Some parts are utility UI but not full data backed | Backfill seller/transport tables if this becomes operational |
| AI market bulletin | Done / Partial | `/api/ai/market-bulletin`, `MarketAiAssistant` | Requires API key and fallback text | Keep graceful fallback and add setup docs |

## School / Institution

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Institution creation and tenant website | Done | `/admin/institutions`, `[domain]/page`, `SchoolTenantWebsite` | Custom domain/subdomain production routing needs deployment test | Add deployment checklist |
| Website CMS | Done / Partial | `InstitutionWebsiteManager`, website publish history SQL | CMS is powerful but can still feel long | Keep accordion sections and preview/publish UX |
| Templates/themes | Partial | design profiles and website defaults exist | Some template changes may not visibly affect all sections | Audit theme fields against rendered CSS |
| School admin portal | Done | `SchoolAdminClient` | Large file, many responsibilities | Consider splitting after stabilization |
| Teacher portal | Done / Partial | `SchoolPortalShell` teacher role | AI scan depends on provider and real image test | Add manual-first flow and AI fallback messaging |
| Student portal | Done / Partial | `SchoolPortalShell` student role | Needs clean demo users/data every time | Improve seed route reliability and visible login guide |
| Guardian updates | Done | guardian API routes | Needs visible website entry point and clear verification copy | Add guardian link block to institution website pages |
| Demo seed | Partial | `/api/admin/seed-school` | User reported seed sometimes leaves no visible data | Add seed result report and fail loudly on table errors |

## Public Site / Navigation

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Home page | Done / Partial | home sections, footer, related links | Header/menu active styling had issues; mobile location modal reported | Continue responsive QA on `/` and location modal |
| Related service links | Done | `RelatedServiceLinks` | Some service pages may still not expose related links | Add related links to every service detail page |
| Footer | Done / Partial | `SiteFooter` | Social/developer info exists but should be checked on all pages | Browser QA footer on mobile/desktop |
| Location selector | Partial | `LocationModal` | User reported union selection/loading issue | Prioritize this as UX blocker |
| Bangla text encoding | Risk | Multiple files show mojibake in source/output | Makes UI look broken in parts of admin/maintenance | Repair visible mojibake gradually, starting high-traffic pages |

## Security And Data Scope

| Area | Current status | Evidence | Remaining gap | Next action |
| --- | --- | --- | --- | --- |
| Role-based login redirect | Done / Partial | login modal/page role checks | Deleted user session can remain locally until auth refresh/logout | Add profile-missing auto sign-out guard globally |
| Household edit permission | Done / Risk | `householdPermissions`, SQL 58 | Must verify server/database enforcement | Add API/RLS test cases |
| Citizen public APIs | Done / Risk | citizen APIs | Public submission is expected, manage routes should be scoped | Review manage route auth/scope |
| Market complaints API | Risk | `/api/market/complaints` uses service role | GET/PATCH should enforce officer scope before production | Harden route with authenticated profile scope |
| Admin mutation APIs | Risk | `/api/admin/*` | Need consistent auth guard review | Create a shared admin route guard helper |

## Highest Priority Fix List

1. Location selector union selection/loading issue.
2. Auth/session guard: if profile/user deleted, force logout and clear stale UI.
3. Server-side household edit scope verification, not only client UI.
4. Market complaints GET/PATCH auth/scope hardening.
5. School seed route: visible seed report and reliable demo data.
6. Mobile QA: household modal, citizen page, ward/union dashboard, market page.
7. Mojibake cleanup on admin maintenance, officer workboard, and any citizen-facing high-traffic text.
8. Deep links from OfficerActionCenter cards to exact tabs/filters.
9. SMS production setup: gateway validation, test-send, Vercel cron.
10. Add a single test guide page/doc for end-to-end flows.

## End-To-End Smoke Test Matrix

| Flow | Test steps | Expected result |
| --- | --- | --- |
| Household field entry | Volunteer login -> own village -> add house -> add members -> GPS -> save | House appears only in assigned village; edit allowed only to assigned volunteer/ward member |
| Citizen service | Public household page -> submit birth/death/certificate request -> chairman portal review -> ready with collection date | Citizen inbox/SMS shows status changes |
| Citizen complaint | `/citizen` -> submit complaint with ward/union -> officer portal update status | Complaint appears scoped; citizen gets update |
| Women support | Chairman dashboard -> citizen quality -> create women support case -> send SMS | Case created and SMS queued |
| Market price | Market manager -> update price -> public market page | Public price updates and trend/history visible |
| Market complaint | Public market utility hub -> submit complaint -> market/admin panel resolve | Complaint moves pending -> resolved |
| SMS recharge | Union/ward portal request recharge -> super admin approve -> send campaign | Wallet balance changes and SMS queue created |
| School seed | Institution admin -> seed demo -> teacher/student portal | Classes, teachers, students, lessons, results visible |
| Institution website | Create institution -> open subdomain/custom domain route -> edit CMS -> publish | Public website reflects theme/content |
| Maintenance audit | Admin maintenance -> readiness -> repair links | Audit counts trend toward zero |
