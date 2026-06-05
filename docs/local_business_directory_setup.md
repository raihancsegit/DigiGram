# Local Business Directory Setup

## Database

Supabase SQL Editor-এ এই ফাইলটি একবার চালান:

`database/61_local_business_directory_and_ads.sql`

Script-টি idempotent, তাই প্রয়োজন হলে আবারও চালানো যাবে।

## Public flow

1. `/business` খুলুন।
2. ইউনিয়ন ও category দিয়ে business খুঁজুন।
3. `ব্যবসা যোগ করুন` থেকে free, featured অথবা premium আবেদন দিন।
4. আবেদন প্রথমে `pending` থাকবে।

## Officer flow

1. Chairman, ward member বা super admin account দিয়ে login করুন।
2. একই `/business` page-এর নিচে `Business verification queue` দেখা যাবে।
3. নিজের scope-এর আবেদন approve/reject করুন।
4. Approved listing-কে ৩০ দিনের featured listing করা যাবে।
5. Chairman বা super admin sponsored ad চালু করতে পারবে।

## Verification SQL

```sql
select status, plan, count(*)
from local_businesses
group by status, plan
order by status, plan;

select status, placement, count(*)
from business_ads
group by status, placement
order by status, placement;
```

Public page-এ শুধু approved business এবং active, non-expired ad দেখা যায়।
