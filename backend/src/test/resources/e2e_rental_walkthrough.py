"""End-to-end rental walkthrough against the seeded owner@livic.com data.

Checks the data that flows, not just the status codes.
"""
import json, urllib.request, urllib.error, uuid, datetime

BASE = "http://localhost:8090"
PASS, FAIL = [], []


def call(method, path, token=None, body=None, expect=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"message": raw[:120]}


def check(label, ok, detail=""):
    (PASS if ok else FAIL).append(label)
    print("%s  %-58s %s" % ("PASS" if ok else "FAIL", label, detail))


def data(resp):
    return resp.get("data") if isinstance(resp, dict) else None


# ---------------------------------------------------------------- 1. sign in
st, r = call("POST", "/api/v1/auth/login",
             body={"email": "owner@livic.com", "password": "Adm!n@super"})
check("1  owner signs in", st == 200 and data(r).get("accessToken"))
T = data(r)["accessToken"]
owner_id = data(r)["user"]["id"]

# ------------------------------------------------------- 2. context & rights
st, r = call("GET", "/api/v1/me/context", T)
ctx = data(r)
managed = ctx.get("managedProperties", [])
check("2  /me/context lists managed properties", st == 200 and len(managed) >= 1,
      "%d managed" % len(managed))
perms = managed[0].get("permissionCodes", []) if managed else []
check("3  owner carries permissions on the property", len(perms) > 0,
      "%d permissions" % len(perms))

# ------------------------------------------------------------ 4. property
st, r = call("GET", "/api/v1/properties", T)
props = data(r).get("content", data(r))
prop = next(p for p in props if p["name"] == "Livic Residency")
pid = prop["id"]
check("4  property list returns Livic Residency", st == 200)
check("5  property response carries no floor count", "totalFloors" not in prop,
      "floors belong to blocks, which differ in height")

# -------------------------------------------------------------- 6. blocks
st, r = call("GET", "/api/v1/properties/%s/blocks" % pid, T)
blocks = data(r)
by_name = {b["name"]: b for b in blocks}
check("6  property has Tower A and Tower B", st == 200 and {"Tower A", "Tower B"} <= set(by_name))
A, B = by_name["Tower A"], by_name["Tower B"]
check("7  Tower A is the default block", A["isDefault"] is True)
check("8  Tower B is not default", B["isDefault"] is False)
check("9  unit counts per block", A["unitCount"] == 10 and B["unitCount"] == 3,
      "A=%d B=%d" % (A["unitCount"], B["unitCount"]))
check("10 floors per block differ", A["totalFloors"] == 5 and B["totalFloors"] == 2,
      "A=%s B=%s" % (A["totalFloors"], B["totalFloors"]))

# ------------------------------------------------- 11. floors scoped to block
st, fa = call("GET", "/api/v1/properties/%s/floors?blockId=%s" % (pid, A["id"]), T)
st2, fb = call("GET", "/api/v1/properties/%s/floors?blockId=%s" % (pid, B["id"]), T)
fa_counts = {f["floorNumber"]: f["unitCount"] for f in data(fa)}
fb_counts = {f["floorNumber"]: f["unitCount"] for f in data(fb)}
check("11 Tower A floor summary", len(fa_counts) == 5 and all(v == 2 for v in fa_counts.values()),
      str(sorted(fa_counts.items())))
check("12 Tower B floor summary is its own, not the property's",
      len(fb_counts) == 2 and fb_counts.get(1) == 2 and fb_counts.get(2) == 1,
      str(sorted(fb_counts.items())))

st, fd = call("GET", "/api/v1/properties/%s/floors" % pid, T)
check("13 omitting blockId falls back to the default block",
      {f["floorNumber"]: f["unitCount"] for f in data(fd)} == fa_counts)

# -------------------------------- 14. the same unit number lives in both blocks
st, la = call("GET", "/api/v1/properties/%s/floors/1/layout?blockId=%s" % (pid, A["id"]), T)
st2, lb = call("GET", "/api/v1/properties/%s/floors/1/layout?blockId=%s" % (pid, B["id"]), T)
a_units = {u["unitNumber"]: u["id"] for u in data(la)}
b_units = {u["unitNumber"]: u["id"] for u in data(lb)}
check("14 Tower A floor 1 holds 101 and 102", set(a_units) == {"101", "102"}, str(sorted(a_units)))
check("15 Tower B floor 1 holds 101 and 102 too", set(b_units) == {"101", "102"}, str(sorted(b_units)))
check("16 they are genuinely different units", a_units["101"] != b_units["101"])

# ------------------------------------------------------ 17. block create/delete
st, r = call("POST", "/api/v1/properties/%s/blocks" % pid, T,
             {"name": "Tower C", "totalFloors": 2})
check("17 a new block can be created", st == 201, data(r)["name"] if st == 201 else r.get("message"))
cid = data(r)["id"] if st == 201 else None
if cid:
    st, r = call("PUT", "/api/v1/properties/%s/blocks/%s" % (pid, cid), T,
                 {"name": "Tower C West", "totalFloors": 3})
    check("18 a block can be renamed", st == 200 and data(r)["name"] == "Tower C West")
    st, r = call("POST", "/api/v1/properties/%s/blocks" % pid, T,
                 {"name": "Tower C West", "totalFloors": 1})
    check("19 duplicate block name refused", st == 409, r.get("message", "")[:44])
    st, r = call("DELETE", "/api/v1/properties/%s/blocks/%s" % (pid, cid), T)
    check("20 an empty block can be deleted", st == 200)
st, r = call("DELETE", "/api/v1/properties/%s/blocks/%s" % (pid, A["id"]), T)
check("21 a block holding units cannot be deleted", st == 409, r.get("message", "")[:44])

# ------------------------------------------------------------ 22. memberships
st, r = call("GET", "/api/v1/properties/%s/memberships" % pid, T)
mem = data(r)
mem_list = mem.get("content", mem) if isinstance(mem, dict) else mem
check("22 property memberships listed", st == 200 and len(mem_list) >= 2,
      "%d members" % len(mem_list))
st, r = call("GET", "/api/v1/permissions/catalog", T)
check("23 permission catalog available", st == 200 and len(data(r) or []) > 0,
      "%d modules" % len(data(r) or []))

# ---------------------------------------------------------------- 24. leases
st, r = call("GET", "/api/v1/finance/leases?propertyId=%s" % pid, T)
leases = data(r).get("content", data(r))
check("24 active leases on the property", st == 200 and len(leases) == 10,
      "%d leases" % len(leases))
sample_lease = leases[0]

# ----------------------------------------- 25. lease and member move together
st, r = call("GET", "/api/v1/properties/%s/units/%s" % (pid, sample_lease.get("unitId")), T) \
    if sample_lease.get("unitId") else (0, {})
st, ctx_t = call("POST", "/api/v1/auth/login", body={
    "email": "tenant_101@livic.com", "password": "Adm!n@super"})
if st == 200:
    TT = data(ctx_t)["accessToken"]
    st, r = call("GET", "/api/v1/me/context", TT)
    units = data(r).get("unitMemberships", [])
    check("25 tenant's context carries a unit membership", st == 200 and len(units) == 1,
          "%d memberships" % len(units))
    if units:
        check("26 that membership names the lease behind it", units[0].get("leaseId") is not None)
        check("27 and the role is TENANT", units[0].get("role") == "TENANT", str(units[0].get("role")))
    check("28 context no longer carries a lease summary", "activeLeases" not in data(r),
          "the tenancy is the unit membership; rent comes from the bill")
    check("28b tenant flag derives from the membership role", data(r).get("isTenant") is True)
else:
    check("25 tenant sign-in", False, "could not log in as tenant_101@livic.com")
    TT = None

# --------------------------------------------------------- 29. charge configs
st, r = call("GET", "/api/v1/finance/charge-configs/property/%s" % pid, T)
cfgs = data(r)
cfgs = cfgs.get("content", cfgs) if isinstance(cfgs, dict) else cfgs
check("29 charge configs present", st == 200 and len(cfgs) >= 1,
      ", ".join(c.get("chargeName", "?") for c in cfgs[:3]))

# ------------------------------------------------------ 30. billing worksheet
st, r = call("GET", "/api/v1/finance/billing-worksheets?propertyId=%s&billingMonth=2026-09&chargeConfigId=%s"
             % (pid, cfgs[0]["id"]), T)
check("30 billing worksheet builds", st == 200, "" if st == 200 else r.get("message", "")[:44])
ws = data(r) or []
ws = ws.get("content", ws) if isinstance(ws, dict) else ws
if st == 200 and ws:
    prefilled = [w for w in ws if w.get("enteredValue")]
    check("31 worksheet prefilled from the lease rent", len(prefilled) > 0,
          "%d of %d rows prefilled" % (len(prefilled), len(ws)))

# ------------------------------------------------------------- 32. pre-flight
st, r = call("GET", "/api/v1/finance/bills/pre-flight?propertyId=%s&billingMonth=2026-09" % pid, T)
pf = data(r)
check("32 pre-flight checklist", st == 200 and pf.get("totalUnits", 0) > 0,
      "units=%s leases=%s ready=%s" % (pf.get("totalUnits"), pf.get("activeLeases"), pf.get("isReady")))

# --------------------------------------------------------------- 33. rent roll
st, r = call("GET", "/api/v1/finance/bills?propertyId=%s&billingMonth=2026-09" % pid, T)
roll = data(r)
bills = roll.get("bills", roll.get("content", []))
metrics = roll.get("metrics", {})
check("33 rent roll returns September bills", st == 200 and len(bills) == 10,
      "%d bills" % len(bills))
check("34 rent roll metrics computed", metrics.get("totalExpectedRevenue") is not None,
      "expected=%s published=%s" % (metrics.get("totalExpectedRevenue"), metrics.get("publishedCount")))
b0 = bills[0] if bills else None
if b0:
    check("35 each bill resolves its tenant and unit",
          b0.get("tenantName") not in (None, "Unknown Tenant") and b0.get("unitNumber") != "Vacant",
          "%s in %s" % (b0.get("tenantName"), b0.get("unitNumber")))
    check("36 bill carries its lease for the client", b0.get("leaseId") is not None)

# ---------------------------------------------------------------- 37. publish
st, r = call("POST", "/api/v1/finance/bills/batch-publish", T,
             {"propertyId": pid, "billingMonth": "2026-09"})
check("37 batch publish succeeds", st == 200 and len(data(r)["succeeded"]) == 10,
      "%d succeeded, %d failed" % (len(data(r)["succeeded"]), len(data(r)["failed"])) if st == 200
      else r.get("message", "")[:44])

# ----------------------------------------------------------- 38. cash payment
if b0:
    unpaid = next((b for b in bills if b.get("status") != "PAID"), None)
    if unpaid:
        due = float(unpaid["totalAmount"]) - float(unpaid.get("amountPaid") or 0)
        st, r = call("POST", "/api/v1/finance/bills/%s/cash" % unpaid["id"], T,
                     {"amount": due, "note": "e2e walkthrough"})
        check("38 cash payment recorded", st in (200, 201),
              "" if st in (200, 201) else r.get("message", "")[:50])
        st, r = call("GET", "/api/v1/finance/bills?propertyId=%s&billingMonth=2026-09" % pid, T)
        after = {b["id"]: b for b in (data(r).get("content") or data(r).get("bills") or [])}
        got = after.get(unpaid["id"], {})
        check("39 the bill is now settled", got.get("status") == "PAID",
              "status=%s paid=%s" % (got.get("status"), got.get("amountPaid")))
    else:
        check("38 cash payment recorded", False, "no unpaid September bill to settle")

# ----------------------------------------------------------------- 40. ledger
st, r = call("GET", "/api/v1/finance/ledger?propertyId=%s" % pid, T)
led = data(r)
entries = led.get("content", led) if isinstance(led, dict) else led
check("40 ledger returns entries", st == 200 and len(entries) > 0, "%d entries" % len(entries))
if entries:
    named = [e for e in entries if e.get("tenantName") not in (None, "N/A")]
    check("41 ledger entries attribute to a payer", len(named) > 0,
          "%d of %d attributed" % (len(named), len(entries)))
st, r = call("GET", "/api/v1/finance/ledger?propertyId=%s&search=101" % pid, T)
check("42 ledger search by unit works", st == 200)

# -------------------------------------------------------------- 43. reporting
st, r = call("GET", "/api/v1/analytics/summary?propertyId=%s" % pid, T)
check("43 analytics summary", st == 200, "" if st == 200 else r.get("message", "")[:44])
st, r = call("GET", "/api/v1/analytics/defaulters?propertyId=%s" % pid, T)
check("44 defaulters report", st == 200)

# ------------------------------------------- 45. guards added earlier this week
occupied = a_units["101"]
st, r = call("PUT", "/api/v1/properties/%s/floors/1/layout?blockId=%s" % (pid, A["id"]), T,
             [{"unitNumber": "102", "gridX": 1, "gridY": 1, "gridWidth": 1, "gridHeight": 1,
               "type": "SINGLE_UNIT", "capacity": 1}])
check("45 layout edit refuses to delete an occupied unit", st == 409,
      r.get("message", "")[:60])

st, r = call("GET", "/api/v1/finance/bills?propertyId=%s&billingMonth=2026-09"
             % "a1b2c3d4-0000-0000-0000-000000000000", T)
check("46 unknown property returns no data rather than someone else's",
      st in (403, 404) or len(data(r).get("bills", [])) == 0 if st == 200 else st in (403, 404),
      "status=%s" % st)

print("\n%d passed, %d failed" % (len(PASS), len(FAIL)))
if FAIL:
    print("\nFailures:")
    for f in FAIL:
        print("  -", f)
