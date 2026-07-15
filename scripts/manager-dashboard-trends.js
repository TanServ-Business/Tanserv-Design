(() => {
  const today = new Date();
  const CURRENT_YEAR = today.getFullYear();
  const CURRENT_MONTH = today.getMonth() + 1;
  const CURRENT_DAY = today.getDate();
  const CURRENT_QUARTER = Math.floor((CURRENT_MONTH - 1) / 3) + 1;
  const CURRENT_MONTH_KEY = `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, "0")}`;
  const CURRENT_QUARTER_KEY = `${CURRENT_YEAR}-Q${CURRENT_QUARTER}`;
  const DATA_AVAILABLE_THROUGH_MONTH_KEY = "2026-02";
  const DEFAULT_YEAR = CURRENT_YEAR;
  const HISTORY_YEARS = 7;
  const chartInstances = {};
  let currentStatusSnapshot = null;
  const currentStatusDrill = {
    activity: null,
    issue: null
  };

  const $ = (id) => document.getElementById(id);
  const round = (value, decimals = 2) => Number(Number(value || 0).toFixed(decimals));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const statusColors = ["#5c258d", "#2563eb", "#0f766e", "#d97706", "#dc2626", "#64748b", "#0891b2", "#7c3aed", "#16a34a", "#f97316", "#be123c"];
  const submissionChannelLabels = {
    physical: "Physically submitted",
    courier: "Courier",
    email: "Email",
    external: "External submission"
  };
  const submissionChannelColors = {
    physical: "rgba(37, 99, 235, 0.62)",
    courier: "rgba(22, 163, 74, 0.58)",
    email: "rgba(245, 158, 11, 0.64)",
    external: "rgba(92, 37, 141, 0.58)"
  };
  const activityDispositionMap = {
    "No Due": ["Within Credit Period/Days", "LC Payment", "As Per Payment Terms", "Retention Amount", "SD Amount"],
    "Part Collected": ["Part Payment through LC done", "Part Payment Made"],
    PTP: ["PTP"],
    "Collection In Progress": ["Funds Issue", "PDC Given", "Call Back", "Cold Call", "Issue With Address Mentioned", "Recon Required", "Not my Invoice", "Call Back/Email Follow up"],
    "Invoice Assignment": ["Assign the Invoice to Others"],
    Guidance: ["Company Closed/Shut down", "Recommended For Legal", "Office Closed/Shut Down", "Shifted - Address Not Found", "Fix Dunning letter strategy", "Send Pre-Legal Letter"],
    "Further Docs Required": ["Invoice Copy Required", "PO (Purchase Order) Copy Required", "Service/PM Report Required", "Compliance Docs (Salary, PF, Attendance & ESI) required", "Indeminity Bond Required", "BG/PBG Required", "GST Challan/ GST Certifcate by CA Required", "Delivery Challan Required", "Statutory Docs(PAN, GST Registration, Turnover Certifcate ) Required"],
    "Further Action Required": ["Wrong/Incorrect Billing", "Payment Wrongly Adjusted", "PO Cancelled/Contract Terminated", "Proposed For Write-Off", "Credit Note To Be Issued", "Vendor Portal Issue", "Reversal & Re-Bill", "Tax Issue On The Invoice", "Customized Invoice Required", "Discount Required", "Customer deduction", "Proposed for Cancellation"],
    "Material Delivery Issues": ["Material Not Received", "Partial Material Received", "Damaged Material Received", "Late Shipment", "Wrong Material Delivered", "Material Delivered To Wrong Site", "Material Recalled/Returned"],
    "Service Related Issues": ["PM Pending", "Equipment Not Working", "Call Not Attended", "Turnkey Project Issues", "Unsatisfactory Service Report By Customer", "Installation Pending", "Commissioning Pending", "Inspection Pending"],
    Collected: ["Collected"]
  };
  const issueDispositionMap = {
    "Further Docs Required": [
      "Invoice Copy Required",
      "PO (Purchase Order) Copy Required",
      "Service/PM Report Required",
      "Compliance Docs (Salary, PF, Attendance & ESI) required",
      "Indeminity Bond Required",
      "BG/PBG Required",
      "GST Challan/ GST Certifcate by CA Required",
      "Delivery Challan Required",
      "Statutory Docs(PAN, GST Registration, Turnover Certifcate ) Required"
    ],
    "Further Action Required": [
      "Wrong/Incorrect Billing",
      "Payment Wrongly Adjusted",
      "PO Cancelled/Contract Terminated",
      "Proposed For Write-Off",
      "Credit Note To Be Issued",
      "Vendor Portal Issue",
      "Reversal & Re-Bill",
      "Tax Issue On The Invoice",
      "Customized Invoice Required",
      "Discount Required",
      "Customer deduction",
      "Proposed for Cancellation"
    ],
    "Material Delivery Issues": [
      "Material Not Received",
      "Partial Material Received",
      "Damaged Material Received",
      "Late Shipment",
      "Wrong Material Delivered",
      "Material Delivered To Wrong Site",
      "Material Recalled/Returned"
    ],
    "Service Related Issues": [
      "PM Pending",
      "Equipment Not Working",
      "Call Not Attended",
      "Turnkey Project Issues",
      "Unsatisfactory Service Report By Customer",
      "Installation Pending",
      "Commissioning Pending",
      "Inspection Pending"
    ]
  };

  const monthToIndex = (key) => {
    const [year, month] = String(key || "").split("-").map(Number);
    return (year * 12) + (month - 1);
  };

  const indexToMonthKey = (index) => {
    const year = Math.floor(index / 12);
    const month = (index % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  };

  const formatMonthLabel = (key, shortYear = false) => {
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "short" });
    return shortYear ? `${label} ${String(year).slice(2)}` : `${label} ${year}`;
  };

  const formatDayLabel = (key, day) => {
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "short" });
    return `${day} ${label}`;
  };

  const formatQuarterLabel = (quarterKey) => {
    const [year, quarter] = String(quarterKey || CURRENT_QUARTER_KEY).split("-Q");
    return `Q${Number(quarter || 1)} ${year}`;
  };

  const fiscalYearLabel = (key) => {
    const [year, month] = key.split("-").map(Number);
    const startYear = month >= 4 ? year : year - 1;
    return `FY${startYear}-${String(startYear + 1).slice(2)}`;
  };

  const fiscalYearDisplay = (startYear) => `FY${startYear}-${String(startYear + 1).slice(2)}`;

  const getDaysInMonth = (key) => {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  };

  const normalizeMix = (source) => {
    const total = Object.values(source).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
    return Object.entries(source).reduce((acc, [key, value]) => {
      acc[key] = round((Number(value || 0) / total) * 100, 1);
      return acc;
    }, {});
  };

  const distributeInteger = (total, weights) => {
    const normalizedTotal = Math.max(0, Math.round(Number(total) || 0));
    const weightTotal = weights.reduce((sum, weight) => sum + Math.max(0.01, Number(weight) || 0), 0) || 1;
    const raw = weights.map((weight) => (Math.max(0.01, Number(weight) || 0) / weightTotal) * normalizedTotal);
    const values = raw.map(Math.floor);
    let remainder = normalizedTotal - values.reduce((sum, value) => sum + value, 0);
    raw
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction)
      .forEach(({ index }) => {
        if (remainder <= 0) return;
        values[index] += 1;
        remainder -= 1;
      });
    return values;
  };

  const makeStatusDistribution = (statusMap, index, totalCount, bias = 0) => {
    const entries = Object.entries(statusMap);
    const primaryWeights = entries.map((_, itemIndex) => (
      1.1 + ((entries.length - itemIndex) * 0.09) + (((index + itemIndex + bias) % 4) * 0.08) + (Math.sin((index + itemIndex + bias) / 4) * 0.16)
    ));
    const primaryValues = distributeInteger(totalCount, primaryWeights);
    const primary = {};
    const subStatus = {};

    entries.forEach(([primaryStatus, subStatuses], primaryIndex) => {
      const primaryCount = primaryValues[primaryIndex] || 0;
      primary[primaryStatus] = primaryCount;
      const subWeights = subStatuses.map((_, subIndex) => (
        1 + (((index + primaryIndex + subIndex + bias) % 5) * 0.11) + (Math.cos((index + subIndex + bias) / 5) * 0.12)
      ));
      const subValues = distributeInteger(primaryCount, subWeights);
      subStatus[primaryStatus] = subStatuses.reduce((acc, label, subIndex) => {
        acc[label] = subValues[subIndex] || 0;
        return acc;
      }, {});
    });

    return { primary, subStatus };
  };

  const mergeStatusDistribution = (records, statusKey) => {
    const merged = { primary: {}, subStatus: {} };
    records.forEach((record) => {
      const distribution = record?.statusMix?.[statusKey];
      if (!distribution) return;
      Object.entries(distribution.primary || {}).forEach(([primaryStatus, value]) => {
        merged.primary[primaryStatus] = (merged.primary[primaryStatus] || 0) + Number(value || 0);
      });
      Object.entries(distribution.subStatus || {}).forEach(([primaryStatus, subStatuses]) => {
        merged.subStatus[primaryStatus] = merged.subStatus[primaryStatus] || {};
        Object.entries(subStatuses || {}).forEach(([subStatus, value]) => {
          merged.subStatus[primaryStatus][subStatus] = (merged.subStatus[primaryStatus][subStatus] || 0) + Number(value || 0);
        });
      });
    });
    return merged;
  };

  const makeCustomerRows = (index, overdueCr, collectedCr) => {
    const customers = [
      "Apollo Pharmacy Pvt Ltd",
      "Blue Star Limited",
      "Varun Beverages",
      "Shiva Healthcare Pvt Ltd",
      "Mediport Labs",
      "Pulse Diagnostics",
      "Lifecrest Hospitals",
      "Zen Meditech",
      "Skyline Healthcare",
      "Careline Pharma"
    ];
    return customers.map((name, customerIndex) => {
      const weight = 1 - (customerIndex * 0.062);
      return {
        name,
        overdueCr: round(Math.max(0.05, overdueCr * 0.12 * weight), 2),
        contributionCr: round(Math.max(0.03, collectedCr * 0.1 * weight), 2),
        risk: customerIndex < 3 ? "High" : (customerIndex < 7 ? "Medium" : "Low")
      };
    }).sort((a, b) => b.overdueCr - a.overdueCr);
  };

  const makeTeamRows = (index, collectedCr, ptpKept, resolvedIssues) => {
    const names = ["Ravi Singh", "Palak Choudhary", "Sakshi Sharma", "Abhishek Sharma", "Priya Nair", "Ankit Verma", "Manish Kumar", "Neha Gupta"];
    return names.map((name, itemIndex) => {
      const factor = 1 - (itemIndex * 0.07) + (((index + itemIndex) % 3) * 0.025);
      return {
        name,
        collectedCr: round(collectedCr * 0.16 * factor, 2),
        ptpKept: Math.max(4, Math.round(ptpKept * 0.15 * factor)),
        issuesResolved: Math.max(2, Math.round(resolvedIssues * 0.14 * factor)),
        rankMove: ((index + itemIndex) % 5) - 2
      };
    }).sort((a, b) => b.collectedCr - a.collectedCr);
  };

  const makeAgingBucketSplit = (overdueCr, seed) => {
    const safeOverdue = Math.max(0, Number(overdueCr) || 0);
    const rawMix = {
      "0-30": 37 + (Math.sin(seed / 2.1) * 5.4) + ((((Math.floor(seed) % 4) + 4) % 4) * 1.2),
      "31-60": 26 + (Math.cos(seed / 2.8) * 4.2) + (((Math.floor(seed + 2) % 5) - 2) * 1.1),
      "61-90": 18 + (Math.sin((seed / 3.4) + 1.2) * 3.8) + (((Math.floor(seed + 1) % 3) - 1) * 1.5),
      "90+": 19 + (Math.cos((seed / 2.5) + 0.9) * 4.8) + (((Math.floor(seed + 3) % 4) - 1.5) * 1.4)
    };
    const positiveMix = Object.fromEntries(
      Object.entries(rawMix).map(([bucket, value]) => [bucket, Math.max(8, value)])
    );
    const mixTotal = Object.values(positiveMix).reduce((sum, value) => sum + value, 0) || 1;
    const bucket0To30 = round(safeOverdue * (positiveMix["0-30"] / mixTotal), 2);
    const bucket31To60 = round(safeOverdue * (positiveMix["31-60"] / mixTotal), 2);
    const bucket61To90 = round(safeOverdue * (positiveMix["61-90"] / mixTotal), 2);

    return {
      "0-30": bucket0To30,
      "31-60": bucket31To60,
      "61-90": bucket61To90,
      "90+": round(Math.max(0, safeOverdue - bucket0To30 - bucket31To60 - bucket61To90), 2)
    };
  };

  const makeSubmissionChannels = (submittedCount, seed) => {
    const values = distributeInteger(submittedCount, [
      1.15 + (Math.sin(seed / 3.1) * 0.15),
      0.62 + (((seed + 1) % 4) * 0.08),
      1.35 + (Math.cos(seed / 4.2) * 0.14),
      0.44 + (((seed + 2) % 5) * 0.05)
    ]);

    return {
      physical: values[0] || 0,
      courier: values[1] || 0,
      email: values[2] || 0,
      external: values[3] || 0
    };
  };

  const buildMonthRecord = (key, index) => {
    const isGeneratedExtension = monthToIndex(key) > monthToIndex(DATA_AVAILABLE_THROUGH_MONTH_KEY);
    const seasonal = 1 + (Math.sin(index / 5) * 0.08);
    const growth = 1 + (index * 0.001);
    const targetCr = round((0.72 + (index % 8) * 0.028) * seasonal * growth, 2);
    const achievementFactor = 0.82 + ((index % 9) * 0.018) + (Math.cos(index / 4) * 0.03);
    const collectedCr = round(targetCr * achievementFactor, 2);
    const totalPtp = 82 + ((index * 3) % 31);
    const ptpKept = Math.round(totalPtp * (0.62 + ((index % 6) * 0.025)));
    const ptpBroken = Math.max(0, totalPtp - ptpKept);
    const ptpAmountCr = round(collectedCr * (0.34 + ((index % 4) * 0.025)), 2);
    const ptpCollectedCr = round(ptpAmountCr * (0.58 + ((index % 7) * 0.035)), 2);
    const issuesRaised = 38 + ((index * 5) % 28);
    const resolvedIssues = Math.round(issuesRaised * (0.58 + ((index % 7) * 0.035)));
    const openIssues = Math.max(5, issuesRaised - Math.round(resolvedIssues * 0.72));
    const escalatedIssues = Math.max(1, Math.round(openIssues * (0.13 + ((index % 3) * 0.025))));
    const currentOutstandingCr = round(8.1 + (Math.sin(index / 3) * 0.52) + (index * 0.012), 2);
    const overdueCr = round(currentOutstandingCr * (0.25 + ((index % 8) * 0.009)), 2);
    const agingBuckets = makeAgingBucketSplit(overdueCr, index);
    const rawMix = {
      digital: 45 + (Math.sin(index / 6) * 5) + (index % 4),
      cash: 8.5 - (Math.sin(index / 5) * 1.4),
      cheque: 15 - ((index % 5) * 0.6),
      bank: 23 + (Math.cos(index / 4) * 2.5),
      upi: 6.5 + ((index % 6) * 0.45),
      other: 4.5
    };
    const collectionMix = normalizeMix(rawMix);
    const lowRisk = 280 + ((index * 7) % 48);
    const mediumRisk = 104 + ((index * 5) % 34);
    const highRisk = 31 + ((index * 2) % 19);
    const newBillingCr = round(targetCr * (0.86 + ((index % 6) * 0.035) + (Math.sin(index / 4) * 0.04)), 2);
    const invoiceCount = 126 + ((index * 11) % 54);
    const submittedCount = Math.min(invoiceCount, Math.round(invoiceCount * (0.84 + ((index % 5) * 0.025))));
    const pendingSubmissionCount = Math.max(0, invoiceCount - submittedCount);
    const submissionChannels = makeSubmissionChannels(submittedCount, index);
    const activityStatusTotal = Math.max(24, Math.round(invoiceCount * (0.7 + ((index % 4) * 0.04))));

    return {
      trendIndex: index,
      month: Number(key.slice(5, 7)),
      year: Number(key.slice(0, 4)),
      quarter: `Q${Math.floor((((Number(key.slice(5, 7)) + 8) % 12) / 3)) + 1}`,
      financialYear: fiscalYearLabel(key),
      dataSource: isGeneratedExtension ? "generated_extension" : "available_seed",
      collections: {
        collectedCr,
        targetCr,
        achievementPct: targetCr > 0 ? round((collectedCr / targetCr) * 100, 1) : 0,
        efficiencyPct: round(72 + ((index % 9) * 1.3) + (Math.sin(index / 4) * 2.4), 1)
      },
      ptp: {
        totalCount: totalPtp,
        amountCr: ptpAmountCr,
        collectedCr: ptpCollectedCr,
        keptCount: ptpKept,
        brokenCount: ptpBroken,
        conversionPct: totalPtp > 0 ? round((ptpKept / totalPtp) * 100, 1) : 0,
        brokenPct: totalPtp > 0 ? round((ptpBroken / totalPtp) * 100, 1) : 0,
        averageTicketCr: totalPtp > 0 ? round(ptpAmountCr / totalPtp, 3) : 0
      },
      issues: {
        raised: issuesRaised,
        open: openIssues,
        resolved: resolvedIssues,
        escalated: escalatedIssues,
        avgResolutionDays: round(4.6 + ((index % 6) * 0.35), 1),
        resolutionPct: issuesRaised > 0 ? round((resolvedIssues / issuesRaised) * 100, 1) : 0,
        topCategory: ["Further docs required", "Further action required", "Material delivery issue", "Service related issue"][index % 4]
      },
      collectionMix,
      billing: {
        newBillingCr,
        invoiceCount,
        submittedCount,
        submissionChannels,
        pendingSubmissionCount,
        submissionPct: invoiceCount > 0 ? round((submittedCount / invoiceCount) * 100, 1) : 0
      },
      aging: {
        currentOutstandingCr,
        overdueCr,
        buckets: agingBuckets,
        highRiskCustomers: highRisk
      },
      risk: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
        intoHigh: 6 + (index % 8),
        outHigh: 4 + ((index + 3) % 7)
      },
      productivity: {
        calls: 840 + ((index * 17) % 190),
        visits: 118 + ((index * 9) % 52),
        followups: 520 + ((index * 13) % 150),
        avgCollectionPerOwnerCr: round(collectedCr / 12, 2),
        avgPtpPerOwner: round(totalPtp / 12, 1),
        avgIssuesResolvedPerOwner: round(resolvedIssues / 12, 1),
        touchedAccounts: 390 + ((index * 11) % 95),
        untouchedAccounts: 42 + ((index * 7) % 31),
        fieldVisitEffectivenessPct: round(58 + ((index % 8) * 2.1), 1),
        callEffectivenessPct: round(43 + ((index % 7) * 1.8), 1),
        contactabilityPct: round(61 + ((index % 6) * 2.2), 1)
      },
      leadership: {
        receivablesCr: currentOutstandingCr,
        dso: round(48 + (Math.sin(index / 5) * 4) + (index % 5), 1),
        cei: round(68 + ((index % 8) * 1.7), 1),
        badDebtRiskCr: round(agingBuckets["90+"] * 0.36, 2),
        cashFlowForecastCr: round(ptpAmountCr * 0.78, 2),
        expectedNextMonthCr: round(targetCr * 0.91, 2),
        varianceCr: round(collectedCr - (targetCr * 0.9), 2),
        recoveryRatePct: round(56 + ((index % 8) * 2.4), 1),
        writeOffRiskCr: round(agingBuckets["90+"] * 0.18, 2),
        disputeValueCr: round(openIssues * 0.015, 2),
        concentrationRiskPct: round(34 + ((index % 9) * 1.1), 1)
      },
      topCustomers: makeCustomerRows(index, overdueCr, collectedCr),
      teamPerformance: makeTeamRows(index, collectedCr, ptpKept, resolvedIssues),
      statusMix: {
        activity: makeStatusDistribution(activityDispositionMap, index, activityStatusTotal, 0),
        issue: makeStatusDistribution(issueDispositionMap, index, issuesRaised, 7)
      },
      regions: {
        North: round(collectedCr * 0.27, 2),
        West: round(collectedCr * 0.31, 2),
        South: round(collectedCr * 0.24, 2),
        East: round(collectedCr * 0.18, 2)
      }
    };
  };

  const createTrendHistory = () => {
    const startIndex = monthToIndex(`${DEFAULT_YEAR - HISTORY_YEARS + 1}-01`);
    const endIndex = monthToIndex(CURRENT_MONTH_KEY);
    const monthCount = Math.max(0, endIndex - startIndex + 1);
    const months = {};
    const monthKeys = Array.from({ length: monthCount }, (_, index) => {
      const key = indexToMonthKey(startIndex + index);
      months[key] = buildMonthRecord(key, index);
      return key;
    });
    return { monthKeys, months };
  };

  const trendHistoryData = createTrendHistory();
  const rangeLabels = {
    all_time: "All Time",
    yearly: "Yearly",
    fiscal_year: "Fiscal Year",
    quarterly: "Quarterly",
    monthly: "Monthly"
  };

  const getAvailableKeys = (keys) => keys.filter((key) => trendHistoryData.months[key]);

  const getYearKeys = (year) => getAvailableKeys(
    Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`)
  );

  const getFiscalYearKeys = (startYear) => getAvailableKeys(
    Array.from({ length: 12 }, (_, index) => {
      const monthOffset = 3 + index;
      const year = startYear + Math.floor(monthOffset / 12);
      const month = (monthOffset % 12) + 1;
      return `${year}-${String(month).padStart(2, "0")}`;
    })
  );

  const getQuarterKeys = (quarterKey) => {
    const [yearText, quarterText] = String(quarterKey || CURRENT_QUARTER_KEY).split("-Q");
    const year = Number(yearText) || CURRENT_YEAR;
    const quarter = clamp(Number(quarterText) || CURRENT_QUARTER, 1, 4);
    const startMonth = ((quarter - 1) * 3) + 1;
    return getAvailableKeys(
      Array.from({ length: 3 }, (_, index) => `${year}-${String(startMonth + index).padStart(2, "0")}`)
    );
  };

  const getAvailableYears = () => [...new Set(trendHistoryData.monthKeys.map((key) => Number(key.slice(0, 4))))];

  const getQuarterOptions = () => {
    const quarterMap = new Map();
    trendHistoryData.monthKeys.forEach((key) => {
      const [year, month] = key.split("-").map(Number);
      const quarter = Math.floor((month - 1) / 3) + 1;
      const quarterKey = `${year}-Q${quarter}`;
      if (!quarterMap.has(quarterKey)) {
        quarterMap.set(quarterKey, formatQuarterLabel(quarterKey));
      }
    });
    return [...quarterMap.entries()].map(([value, label]) => ({ value, label }));
  };

  const getMonthOptions = () => trendHistoryData.monthKeys.map((key) => ({
    value: key,
    label: formatMonthLabel(key)
  }));

  const makeTrendPoint = (label, records) => {
    const source = records.filter(Boolean);
    const collectedCr = round(source.reduce((sum, record) => sum + record.collections.collectedCr, 0), 2);
    const targetCr = round(source.reduce((sum, record) => sum + record.collections.targetCr, 0), 2);
    const ptpAmountCr = round(source.reduce((sum, record) => sum + record.ptp.amountCr, 0), 2);
    const ptpCollectedCr = round(source.reduce((sum, record) => sum + record.ptp.collectedCr, 0), 2);
    const billingCr = round(source.reduce((sum, record) => sum + record.billing.newBillingCr, 0), 2);
    const invoiceCount = source.reduce((sum, record) => sum + record.billing.invoiceCount, 0);
    const submittedCount = source.reduce((sum, record) => sum + (record.billing.submittedCount || 0), 0);
    const submissionChannels = Object.keys(submissionChannelLabels).reduce((acc, channel) => {
      acc[channel] = source.reduce((sum, record) => sum + (record.billing.submissionChannels?.[channel] || 0), 0);
      return acc;
    }, {});
    const visits = source.reduce((sum, record) => sum + (record.productivity?.visits || 0), 0);
    const agingBuckets = ["0-30", "31-60", "61-90", "90+"].reduce((acc, bucket) => {
      acc[bucket] = round(source.reduce((sum, record) => sum + (record.aging.buckets[bucket] || 0), 0), 2);
      return acc;
    }, {});
    const teamPerformance = Object.values(source.reduce((acc, record) => {
      record.teamPerformance.forEach((row) => {
        acc[row.name] = acc[row.name] || { name: row.name, collectedCr: 0 };
        acc[row.name].collectedCr = round(acc[row.name].collectedCr + row.collectedCr, 2);
      });
      return acc;
    }, {})).sort((a, b) => b.collectedCr - a.collectedCr);

    return {
      label,
      collections: { collectedCr, targetCr },
      ptp: { amountCr: ptpAmountCr, collectedCr: ptpCollectedCr },
      issues: {
        raised: source.reduce((sum, record) => sum + record.issues.raised, 0),
        resolved: source.reduce((sum, record) => sum + record.issues.resolved, 0)
      },
      billing: { newBillingCr: billingCr, invoiceCount, submittedCount, submissionChannels },
      productivity: { visits },
      aging: { buckets: agingBuckets },
      teamPerformance
    };
  };

  const makeDailyRecord = (record, share, agingSeed = record.trendIndex) => ({
    collections: {
      collectedCr: round(record.collections.collectedCr * share, 2),
      targetCr: round(record.collections.targetCr * share, 2)
    },
    ptp: {
      amountCr: round(record.ptp.amountCr * share, 2),
      collectedCr: round(record.ptp.collectedCr * share, 2)
    },
    issues: {
      raised: Math.max(0, Math.round(record.issues.raised * share)),
      resolved: Math.max(0, Math.round(record.issues.resolved * share))
    },
    billing: {
      newBillingCr: round(record.billing.newBillingCr * share, 2),
      invoiceCount: Math.max(0, Math.round(record.billing.invoiceCount * share)),
      submittedCount: Math.max(0, Math.round(record.billing.submittedCount * share)),
      submissionChannels: Object.keys(submissionChannelLabels).reduce((acc, channel) => {
        acc[channel] = Math.max(0, Math.round((record.billing.submissionChannels?.[channel] || 0) * share));
        return acc;
      }, {})
    },
    productivity: {
      visits: Math.max(0, Math.round(record.productivity.visits * share))
    },
    aging: {
      buckets: makeAgingBucketSplit(record.aging.overdueCr, agingSeed)
    },
    teamPerformance: record.teamPerformance.map((row) => ({
      name: row.name,
      collectedCr: round(row.collectedCr * share, 2)
    }))
  });

  const makeDailyPoints = (monthKey) => {
    const record = trendHistoryData.months[monthKey];
    if (!record) return [];
    const daysInMonth = getDaysInMonth(monthKey);
    const visibleDays = monthKey === CURRENT_MONTH_KEY ? Math.min(CURRENT_DAY, daysInMonth) : daysInMonth;
    const weights = Array.from({ length: visibleDays }, (_, index) => {
      const day = index + 1;
      return 0.85 + ((day % 6) * 0.08) + (Math.sin(day / 4) * 0.05);
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    return weights.map((weight, index) => {
      const day = index + 1;
      return makeTrendPoint(formatDayLabel(monthKey, day), [makeDailyRecord(record, weight / totalWeight, record.trendIndex + (day * 0.72))]);
    }).filter((point) => point.collections.targetCr > 0);
  };

  const makeDailyClosingStatus = (monthKey, day) => {
    const record = trendHistoryData.months[monthKey];
    if (!record) {
      return {
        label: `Pie data: ${formatDayLabel(monthKey || CURRENT_MONTH_KEY, day || CURRENT_DAY)} ${String(monthKey || CURRENT_MONTH_KEY).slice(0, 4)}`,
        activity: { primary: {}, subStatus: {} },
        issue: { primary: {}, subStatus: {} }
      };
    }
    const daysInMonth = getDaysInMonth(monthKey);
    const visibleDay = clamp(Number(day) || 1, 1, daysInMonth);
    const dayFactor = 0.84 + ((visibleDay % 6) * 0.08) + (Math.sin(visibleDay / 4) * 0.05);
    const activityTotal = Math.max(1, Math.round((record.billing.invoiceCount / daysInMonth) * dayFactor));
    const issueTotal = Math.max(1, Math.round((record.issues.raised / daysInMonth) * dayFactor));
    return {
      label: `Pie data: ${formatDayLabel(monthKey, visibleDay)} ${record.year}`,
      activity: makeStatusDistribution(activityDispositionMap, record.trendIndex + visibleDay, activityTotal, 3),
      issue: makeStatusDistribution(issueDispositionMap, record.trendIndex + visibleDay, issueTotal, 11)
    };
  };

  const makeClosingStatusFromRecords = (records, label) => ({
    label: `Pie data: ${label}`,
    activity: mergeStatusDistribution(records, "activity"),
    issue: mergeStatusDistribution(records, "issue")
  });

  const getRangeLabel = (keys, fallbackStart, fallbackEnd) => {
    const firstKey = keys[0] || fallbackStart;
    const lastKey = keys[keys.length - 1] || fallbackEnd || firstKey;
    return `${formatMonthLabel(firstKey)} to ${formatMonthLabel(lastKey)}`;
  };

  const getPeriodData = (range, activeYear, activePeriodKey) => {
    if (range === "all_time") {
      const records = trendHistoryData.monthKeys.map((key) => trendHistoryData.months[key]).filter(Boolean);
      const points = getAvailableYears().map((year) => {
        const yearKeys = getYearKeys(year);
        const yearRecords = yearKeys.map((key) => trendHistoryData.months[key]).filter(Boolean);
        return makeTrendPoint(String(year), yearRecords);
      }).filter((point) => point.collections.targetCr > 0);
      const allTimeLabel = getRangeLabel(trendHistoryData.monthKeys, `${DEFAULT_YEAR - HISTORY_YEARS + 1}-01`, CURRENT_MONTH_KEY);
      const closingYear = Number(points[points.length - 1]?.label) || CURRENT_YEAR;
      const closingRecords = getYearKeys(closingYear).map((key) => trendHistoryData.months[key]).filter(Boolean);
      return {
        records,
        points,
        label: `All Time | ${HISTORY_YEARS}-year trend | ${allTimeLabel}`,
        closingStatus: makeClosingStatusFromRecords(closingRecords, String(closingYear))
      };
    }

    if (range === "fiscal_year") {
      const keys = getFiscalYearKeys(activeYear);
      const records = keys.map((key) => trendHistoryData.months[key]).filter(Boolean);
      const points = keys.map((key) => makeTrendPoint(formatMonthLabel(key, true), [trendHistoryData.months[key]])).filter((point) => point.collections.targetCr > 0);
      const periodLabel = getRangeLabel(keys, `${activeYear}-04`, `${activeYear + 1}-03`);
      return {
        records,
        points,
        label: `Fiscal Year | ${fiscalYearDisplay(activeYear)} | ${periodLabel}`,
        closingStatus: makeClosingStatusFromRecords(records.slice(-1), formatMonthLabel(keys[keys.length - 1] || `${activeYear}-04`))
      };
    }

    if (range === "quarterly") {
      const quarterKey = activePeriodKey || CURRENT_QUARTER_KEY;
      const keys = getQuarterKeys(quarterKey);
      const records = keys.map((key) => trendHistoryData.months[key]).filter(Boolean);
      const points = keys.map((key) => makeTrendPoint(formatMonthLabel(key, true), [trendHistoryData.months[key]])).filter((point) => point.collections.targetCr > 0);
      const periodLabel = getRangeLabel(keys, keys[0] || CURRENT_MONTH_KEY, keys[keys.length - 1] || CURRENT_MONTH_KEY);
      return {
        records,
        points,
        label: `Quarterly | ${formatQuarterLabel(quarterKey)} | ${periodLabel}`,
        closingStatus: makeClosingStatusFromRecords(records.slice(-1), formatMonthLabel(keys[keys.length - 1] || CURRENT_MONTH_KEY))
      };
    }

    if (range === "monthly") {
      const monthKey = activePeriodKey || CURRENT_MONTH_KEY;
      const record = trendHistoryData.months[monthKey];
      const daysInSeries = monthKey === CURRENT_MONTH_KEY ? Math.min(CURRENT_DAY, getDaysInMonth(monthKey)) : getDaysInMonth(monthKey);
      const firstDayLabel = formatDayLabel(monthKey, 1);
      const lastDayLabel = formatDayLabel(monthKey, daysInSeries);
      return {
        records: record ? [record] : [],
        points: makeDailyPoints(monthKey),
        label: `Monthly | ${formatMonthLabel(monthKey)} | ${firstDayLabel} to ${lastDayLabel}`,
        closingStatus: makeDailyClosingStatus(monthKey, daysInSeries)
      };
    }

    const keys = getYearKeys(activeYear);
    const records = keys.map((key) => trendHistoryData.months[key]).filter(Boolean);
    const points = keys.map((key) => makeTrendPoint(formatMonthLabel(key, true), [trendHistoryData.months[key]])).filter((point) => point.collections.targetCr > 0);
    const periodLabel = getRangeLabel(keys, `${activeYear}-01`, `${activeYear}-12`);
    const throughLabel = activeYear === CURRENT_YEAR ? ` | Through ${formatMonthLabel(CURRENT_MONTH_KEY)}` : "";
    return {
      records,
      points,
      label: `Yearly | ${activeYear} | ${periodLabel}${throughLabel}`,
      closingStatus: makeClosingStatusFromRecords(records.slice(-1), formatMonthLabel(keys[keys.length - 1] || `${activeYear}-01`))
    };
  };

  const setText = (id, value) => {
    const node = $(id);
    if (node) node.textContent = value;
  };

  const formatCr = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} Cr`;
  const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");
  const formatPct = (value) => `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`;
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#475569",
          boxWidth: 10,
          font: { size: 11 }
        }
      },
      tooltip: {
        backgroundColor: "#4b1f73",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: { color: "#64748b", font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: { color: "#64748b", font: { size: 10 } }
      }
    }
  };

  const setChart = (canvasId, config) => {
    const canvas = $(canvasId);
    if (!canvas || !window.Chart) return;
    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
      chartInstances[canvasId] = null;
    }
    chartInstances[canvasId] = new Chart(canvas.getContext("2d"), config);
  };

  const destroyChart = (canvasId) => {
    if (!chartInstances[canvasId]) return;
    chartInstances[canvasId].destroy();
    chartInstances[canvasId] = null;
  };

  const buildChartOptions = (overrides = {}) => ({
    ...chartBaseOptions,
    ...overrides,
    plugins: {
      ...chartBaseOptions.plugins,
      ...(overrides.plugins || {})
    },
    scales: overrides.scales === false ? {} : ["x", "y"].reduce((acc, axis) => {
      acc[axis] = {
        ...(chartBaseOptions.scales[axis] || {}),
        ...((overrides.scales || {})[axis] || {})
      };
      return acc;
    }, {})
  });

  const agentCollectionLabelPlugin = {
    id: "agentCollectionLabelPlugin",
    afterDraw(chart) {
      const options = chart.options.plugins?.agentCollectionLabels;
      if (!options) return;
      const { ctx, chartArea, scales } = chart;
      const firstMeta = chart.getDatasetMeta(0);
      const lastMeta = chart.getDatasetMeta(1);
      const firstValues = chart.data.datasets[0]?.data || [];
      const lastValues = chart.data.datasets[1]?.data || [];
      const names = chart.data.labels || [];

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 10px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      firstMeta.data.forEach((bar, index) => {
        const value = Number(firstValues[index] || 0);
        ctx.fillStyle = "#4b2f80";
        ctx.fillText(value.toFixed(2), bar.x, Math.max(chartArea.top + 10, bar.y - 9));
      });
      lastMeta.data.forEach((bar, index) => {
        const value = Number(lastValues[index] || 0);
        ctx.fillStyle = "#4c149d";
        ctx.fillText(value.toFixed(2), bar.x, Math.max(chartArea.top + 10, bar.y - 9));
      });

      ctx.font = "500 10px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      names.forEach((name, index) => {
        const centerX = scales.x.getPixelForValue(index);
        const firstValue = Number(firstValues[index] || 0);
        const lastValue = Number(lastValues[index] || 0);
        const growth = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        ctx.fillStyle = "#475569";
        ctx.fillText(name, centerX, chartArea.bottom + 16);
        ctx.fillStyle = growth >= 0 ? "#16a34a" : "#dc2626";
        ctx.font = "700 10px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(`${growth >= 0 ? "\u2191" : "\u2193"} ${Math.abs(growth).toFixed(1)}%`, centerX, chartArea.bottom + 32);
        ctx.font = "500 10px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      });
      ctx.restore();
    }
  };

  const getAgingShare = (record, bucket) => {
    const total = Object.values(record.aging.buckets).reduce((sum, value) => sum + Number(value || 0), 0) || 1;
    return round((Number(record.aging.buckets[bucket] || 0) / total) * 100, 1);
  };

  const getPointTotals = (points) => points.reduce((totals, point) => {
    totals.collectionCr += point.collections.collectedCr || 0;
    totals.commitmentCr += point.collections.targetCr || 0;
    totals.ptpCommittedCr += point.ptp.amountCr || 0;
    totals.ptpCollectedCr += point.ptp.collectedCr || 0;
    totals.issuesRaised += point.issues.raised || 0;
    totals.issuesResolved += point.issues.resolved || 0;
    totals.billingCr += point.billing.newBillingCr || 0;
    totals.visits += point.productivity.visits || 0;
    totals.invoices += point.billing.invoiceCount || 0;
    totals.submitted += point.billing.submittedCount || 0;
    return totals;
  }, {
    collectionCr: 0,
    commitmentCr: 0,
    ptpCommittedCr: 0,
    ptpCollectedCr: 0,
    issuesRaised: 0,
    issuesResolved: 0,
    billingCr: 0,
    visits: 0,
    invoices: 0,
    submitted: 0
  });

  const renderSparkLine = ({ values, labels, color, formatValue }) => {
    const safeValues = values.map((value) => Number(value || 0));
    const width = 168;
    const height = 46;
    const padX = 7;
    const padY = 7;
    const min = Math.min(...safeValues, 0);
    const max = Math.max(...safeValues, 1);
    const range = max - min || 1;
    const points = safeValues.map((value, index) => {
      const x = safeValues.length === 1
        ? width / 2
        : padX + ((index / (safeValues.length - 1)) * (width - (padX * 2)));
      const y = height - padY - (((value - min) / range) * (height - (padY * 2)));
      return { x: round(x, 1), y: round(y, 1), value };
    });
    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    const areaPoints = `${padX},${height - padY} ${linePoints} ${width - padX},${height - padY}`;
    const latestLabel = labels[labels.length - 1] || "Latest";
    const latestValue = safeValues[safeValues.length - 1] || 0;
    const formatter = typeof formatValue === "function" ? formatValue : (value) => String(value);

    return `
      <svg class="trendMiniLine" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(`${latestLabel}: ${formatter(latestValue)}`)}" style="--trend-insight-color:${color}">
        <title>${escapeHtml(`${latestLabel}: ${formatter(latestValue)}`)}</title>
        <polygon class="trendMiniLineArea" points="${areaPoints}"></polygon>
        <polyline class="trendMiniLinePath" points="${linePoints}"></polyline>
        ${points.map((point, index) => `
          <circle class="trendMiniLinePoint" cx="${point.x}" cy="${point.y}" r="3">
            <title>${escapeHtml(`${labels[index] || `Point ${index + 1}`}: ${formatter(point.value)}`)}</title>
          </circle>
        `).join("")}
      </svg>
    `;
  };

  const renderInsightCards = (points) => {
    const grid = $("trendInsightGrid");
    if (!grid) return;
    const totals = getPointTotals(points || []);
    const lastPoint = points[points.length - 1] || {};
    const collectionPct = totals.commitmentCr > 0 ? (totals.collectionCr / totals.commitmentCr) * 100 : 0;
    const ptpPct = totals.ptpCommittedCr > 0 ? (totals.ptpCollectedCr / totals.ptpCommittedCr) * 100 : 0;
    const issuePct = totals.issuesRaised > 0 ? (totals.issuesResolved / totals.issuesRaised) * 100 : 0;
    const submissionPct = totals.invoices > 0 ? (totals.submitted / totals.invoices) * 100 : 0;
    const issueGap = Math.max(0, Math.round(totals.issuesRaised - totals.issuesResolved));
    const pendingInvoices = Math.max(0, Math.round(totals.invoices - totals.submitted));
    const aging90Share = lastPoint.aging ? getAgingShare(lastPoint, "90+") : 0;
    const cards = [
      {
        icon: "bi-bullseye",
        color: "#2563eb",
        rgb: "37, 99, 235",
        label: "Collection Achievement",
        value: formatPct(collectionPct),
        meta: "of commitment",
        values: points.map((point) => point.collections.collectedCr),
        formatValue: formatCr
      },
      {
        icon: "bi-bezier2",
        color: "#16a34a",
        rgb: "22, 163, 74",
        label: "PTP Conversion",
        value: formatPct(ptpPct),
        meta: "of committed",
        values: points.map((point) => point.ptp.collectedCr),
        formatValue: formatCr
      },
      {
        icon: "bi-tools",
        color: "#d97706",
        rgb: "217, 119, 6",
        label: "Issue Closure",
        value: formatPct(issuePct),
        meta: `${formatCount(issueGap)} open gap`,
        values: points.map((point) => point.issues.resolved),
        formatValue: (value) => `${formatCount(value)} resolved`
      },
      {
        icon: "bi-envelope-check",
        color: "#5c258d",
        rgb: "92, 37, 141",
        label: "Invoice Submission",
        value: formatPct(submissionPct),
        meta: `${formatCount(pendingInvoices)} pending`,
        values: points.map((point) => point.billing.submittedCount),
        formatValue: (value) => `${formatCount(value)} submitted`
      }
    ];
    const sparkLabels = points.map((point) => point.label);

    grid.innerHTML = cards.map((card) => `
      <article class="trendInsightMetric" style="--trend-insight-color:${card.color}; --trend-insight-rgb:${card.rgb}">
        <span class="trendInsightIcon"><i class="bi ${card.icon}" aria-hidden="true"></i></span>
        <div>
          <div class="trendInsightLabel">${card.label}</div>
          <div class="trendInsightValue">${card.value}</div>
          <div class="trendInsightMeta">${card.meta}</div>
        </div>
        ${renderSparkLine({ values: card.values, labels: sparkLabels, color: card.color, formatValue: card.formatValue })}
      </article>
    `).join("") + `
      <div class="trendPriorityFocus">
        <span class="trendInsightIcon" style="--trend-insight-color:#f97316; --trend-insight-rgb:249, 115, 22"><i class="bi bi-flag-fill" aria-hidden="true"></i></span>
        <div>
          <strong>Priority Focus</strong>
          <span>90+ overdue at ${formatPct(aging90Share)}. Focus on high-value overdue accounts and accelerate issue closure.</span>
        </div>
      </div>
    `;
  };

  const renderStatusCallouts = (calloutId, entries, total, colors) => {
    const node = $(calloutId);
    if (!node) return;
    if (!entries.length) {
      node.innerHTML = `<div class="trendStatusCallout">No data</div>`;
      return;
    }
    node.innerHTML = entries.slice(0, 5).map(([label, value], index) => {
      const pct = total > 0 ? (Number(value || 0) / total) * 100 : 0;
      return `
        <div class="trendStatusCallout" style="--status-color:${colors[index % colors.length]}">
          <span class="trendStatusDot" aria-hidden="true"></span>
          <span class="trendStatusName" title="${label}">${label}</span>
          <span class="trendStatusValue">${formatPct(pct)} (${formatCount(value)})</span>
        </div>
      `;
    }).join("");
  };

  const renderStatusDoughnut = ({ statusKey, canvasId, metaId, primaryBtnId, calloutId, distribution, fallbackLabel }) => {
    const activePrimary = currentStatusDrill[statusKey];
    const source = activePrimary
      ? (distribution?.subStatus?.[activePrimary] || {})
      : (distribution?.primary || {});
    const entries = Object.entries(source)
      .filter(([, value]) => Number(value || 0) > 0)
      .sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([label]) => label);
    const values = entries.map(([, value]) => value);
    const colors = labels.map((_, index) => statusColors[index % statusColors.length]);
    const total = values.reduce((sum, value) => sum + Number(value || 0), 0);
    const hasData = values.length > 0;
    const primaryBtn = $(primaryBtnId);
    const meta = $(metaId);

    if (primaryBtn) primaryBtn.hidden = !activePrimary;
    if (meta) {
      meta.textContent = `${currentStatusSnapshot?.label || fallbackLabel}${activePrimary ? ` | ${activePrimary}` : " | Primary statuses"}`;
    }

    setChart(canvasId, {
      type: "doughnut",
      data: hasData
        ? { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] }
        : { labels: ["No data"], datasets: [{ data: [1], backgroundColor: ["#cbd5e1"], borderWidth: 0 }] },
      options: buildChartOptions({
        cutout: "64%",
        scales: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: hasData }
        },
        onClick: (_event, elements, chart) => {
          if (activePrimary || !elements?.length) return;
          const selectedLabel = chart?.data?.labels?.[elements[0].index];
          if (!selectedLabel || !distribution?.subStatus?.[selectedLabel]) return;
          currentStatusDrill[statusKey] = String(selectedLabel);
          renderStatusPies(currentStatusSnapshot);
        }
      })
    });
    renderStatusCallouts(calloutId, entries, total, colors);
  };

  const renderStatusPies = (closingStatus) => {
    currentStatusSnapshot = closingStatus || currentStatusSnapshot;
    renderStatusDoughnut({
      statusKey: "activity",
      canvasId: "trendActivityStatusChart",
      metaId: "trendActivityStatusMeta",
      primaryBtnId: "trendActivityPrimaryBtn",
      calloutId: "trendActivityStatusCallouts",
      distribution: currentStatusSnapshot?.activity,
      fallbackLabel: "Pie data: -"
    });
    renderStatusDoughnut({
      statusKey: "issue",
      canvasId: "trendIssueStatusChart",
      metaId: "trendIssueStatusMeta",
      primaryBtnId: "trendIssuePrimaryBtn",
      calloutId: "trendIssueStatusCallouts",
      distribution: currentStatusSnapshot?.issue,
      fallbackLabel: "Pie data: -"
    });
  };

  const resetStatusDrill = () => {
    currentStatusDrill.activity = null;
    currentStatusDrill.issue = null;
  };

  const renderCharts = (points, closingStatus) => {
    const labels = points.map((point) => point.label);
    const totals = getPointTotals(points);
    renderInsightCards(points);
    setText("trendVisitTotal", formatCount(totals.visits));
    setText("trendBillingTotal", formatCr(totals.billingCr));
    setChart("trendCollectionChart", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Collection",
            data: points.map((point) => point.collections.collectedCr),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.18)",
            borderWidth: 2,
            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointHoverRadius: 5,
            pointRadius: 3.5,
            tension: 0.34,
            fill: true
          }
        ]
      },
      options: buildChartOptions({
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: (value) => `Rs. ${value} Cr` } }
        }
      })
    });

    setChart("trendOperationsChart", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Visits",
            data: points.map((point) => point.productivity.visits),
            borderColor: "#5c258d",
            backgroundColor: "rgba(92, 37, 141, 0.08)",
            borderWidth: 2,
            pointBackgroundColor: "#5c258d",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointHoverRadius: 5,
            pointRadius: 3,
            tension: 0.28,
            fill: false
          }
        ]
      },
      options: buildChartOptions({
        plugins: { legend: { display: false } }
      })
    });

    setChart("trendSubmissionChart", {
      type: "bar",
      data: {
        labels,
        datasets: Object.entries(submissionChannelLabels).map(([channel, label]) => ({
          label,
          data: points.map((point) => point.billing.submissionChannels?.[channel] || 0),
          backgroundColor: submissionChannelColors[channel],
          borderColor: submissionChannelColors[channel].replace(/0\.\d+\)/, "0.9)"),
          borderWidth: 1,
          borderRadius: 5,
          maxBarThickness: 34
        }))
      },
      options: buildChartOptions({
        scales: {
          x: { stacked: true },
          y: { stacked: true }
        }
      })
    });

    setChart("trendPtpChart", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "PTP committed",
            data: points.map((point) => point.ptp.amountCr),
            borderColor: "#5c258d",
            backgroundColor: "rgba(92, 37, 141, 0.18)",
            borderWidth: 2,
            pointBackgroundColor: "#5c258d",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointHoverRadius: 5,
            pointRadius: 3,
            tension: 0.34,
            fill: true
          },
          {
            label: "PTP collected",
            data: points.map((point) => point.ptp.collectedCr),
            borderColor: "#16a34a",
            backgroundColor: "rgba(22, 163, 74, 0.14)",
            borderWidth: 2,
            pointBackgroundColor: "#16a34a",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointHoverRadius: 5,
            pointRadius: 3,
            tension: 0.34,
            fill: true
          }
        ]
      },
      options: buildChartOptions({
        scales: {
          y: { ticks: { callback: (value) => `Rs. ${value} Cr` } }
        }
      })
    });

    setChart("trendAgingChart", {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "0-30", data: points.map((point) => getAgingShare(point, "0-30")), borderColor: "#2563eb", backgroundColor: "rgba(37, 99, 235, 0.78)", borderWidth: 1.5, pointRadius: 0, tension: 0.35, fill: true, stack: "aging" },
          { label: "31-60", data: points.map((point) => getAgingShare(point, "31-60")), borderColor: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.68)", borderWidth: 1.5, pointRadius: 0, tension: 0.35, fill: true, stack: "aging" },
          { label: "61-90", data: points.map((point) => getAgingShare(point, "61-90")), borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.72)", borderWidth: 1.5, pointRadius: 0, tension: 0.35, fill: true, stack: "aging" },
          { label: "90+", data: points.map((point) => getAgingShare(point, "90+")), borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.72)", borderWidth: 1.5, pointRadius: 0, tension: 0.35, fill: true, stack: "aging" }
        ]
      },
      options: buildChartOptions({
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, max: 100, ticks: { callback: (value) => `${value}%` } }
        }
      })
    });

    setChart("trendBillingChart", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "New billing",
            data: points.map((point) => point.billing.newBillingCr),
            borderColor: "#0284c7",
            backgroundColor: "rgba(14, 165, 233, 0.16)",
            borderWidth: 2,
            pointBackgroundColor: "#0284c7",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointHoverRadius: 5,
            pointRadius: 3,
            tension: 0.34,
            fill: true
          }
        ]
      },
      options: buildChartOptions({
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { ticks: { callback: (value) => `Rs. ${value} Cr` } }
        }
      })
    });

    const firstPoint = points[0] || { teamPerformance: [] };
    const lastPoint = points[points.length - 1] || { teamPerformance: [] };
    const agentNames = lastPoint.teamPerformance.slice(0, 8).map((row) => row.name);
    const firstAgentValues = agentNames.map((name) => firstPoint.teamPerformance.find((row) => row.name === name)?.collectedCr || 0);
    const lastAgentValues = agentNames.map((name) => lastPoint.teamPerformance.find((row) => row.name === name)?.collectedCr || 0);
    const maxAgentValue = Math.max(...firstAgentValues, ...lastAgentValues, 1);
    setChart("trendAgentCollectionChart", {
      type: "bar",
      data: {
        labels: agentNames,
        datasets: [
          {
            label: firstPoint.label || "Start",
            data: firstAgentValues,
            backgroundColor: "rgba(186, 154, 224, 0.72)",
            borderColor: "rgba(186, 154, 224, 0.92)",
            borderWidth: 1,
            borderRadius: { topLeft: 18, topRight: 18 },
            barPercentage: 0.72,
            categoryPercentage: 0.58
          },
          {
            label: lastPoint.label || "Latest",
            data: lastAgentValues,
            backgroundColor: "#4c149d",
            borderColor: "#4c149d",
            borderWidth: 1,
            borderRadius: { topLeft: 18, topRight: 18 },
            barPercentage: 0.72,
            categoryPercentage: 0.58
          }
        ]
      },
      plugins: [agentCollectionLabelPlugin],
      options: buildChartOptions({
        layout: { padding: { top: 18, bottom: 38, right: 10 } },
        plugins: {
          agentCollectionLabels: true,
          legend: {
            position: "top",
            align: "start",
            labels: {
              color: "#334155",
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: false,
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: Rs. ${Number(context.parsed.y || 0).toFixed(2)} Cr`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { display: false }
          },
          y: {
            suggestedMax: Math.ceil(maxAgentValue * 1.2 * 10) / 10,
            ticks: { callback: (value) => `Rs. ${value} Cr` }
          }
        }
      })
    });
    renderStatusPies(closingStatus);
  };

  const markTrendsVisible = () => {
    document.querySelectorAll(".performanceTrendsView .trendPanel, .performanceTrendsView .trendChartCard")
      .forEach((node) => node.classList.add("is-visible"));
  };

  const setSelectOptions = (select, options, selectedValue) => {
    if (!select) return selectedValue;
    select.innerHTML = "";
    options.forEach((option) => {
      const node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      select.appendChild(node);
    });
    const values = options.map((option) => option.value);
    const normalizedValue = values.includes(selectedValue) ? selectedValue : (values[values.length - 1] || "");
    select.value = normalizedValue;
    return normalizedValue;
  };

  const init = () => {
    const toggleBtn = $("dashboardTrendsToggle");
    const trendView = $("performanceTrendsView");
    const yearInput = $("trendYearInput");
    const rangeSelect = $("trendRangeSelect");
    const yearGroup = $("trendYearGroup");
    const yearLabel = $("trendYearLabel");
    const periodGroup = $("trendPeriodGroup");
    const periodLabel = $("trendPeriodLabel");
    const periodSelect = $("trendPeriodSelect");
    const rangeButtons = Array.from(document.querySelectorAll("[data-trend-range]"));
    if (!toggleBtn || !trendView || !yearInput || !rangeSelect || !periodSelect) return;

    const nowGrid = trendView.previousElementSibling?.classList.contains("chartGrid")
      ? trendView.previousElementSibling
      : document.querySelector(".agentDashboard > .chartGrid");
    if (!nowGrid) return;
    const nowTopGrid = document.querySelector(".dashboardTopGrid");

    const minYear = Math.min(...trendHistoryData.monthKeys.map((key) => Number(key.slice(0, 4))));
    const maxYear = Math.max(...trendHistoryData.monthKeys.map((key) => Number(key.slice(0, 4))));
    const state = {
      activeYear: DEFAULT_YEAR,
      activeQuarter: CURRENT_QUARTER_KEY,
      activeMonth: CURRENT_MONTH_KEY,
      range: "yearly",
      isTrendsVisible: false,
      hasRendered: false
    };
    const quarterOptions = getQuarterOptions();
    const monthOptions = getMonthOptions();

    yearInput.min = String(minYear);
    yearInput.max = String(maxYear);
    yearInput.value = String(DEFAULT_YEAR);
    rangeSelect.value = "yearly";

    const syncRangeButtons = () => {
      rangeButtons.forEach((button) => {
        const isActive = button.dataset.trendRange === state.range;
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };

    const syncTrendControls = () => {
      const usesYearInput = state.range === "yearly" || state.range === "fiscal_year";
      if (yearGroup) yearGroup.hidden = !usesYearInput;
      if (periodGroup) periodGroup.hidden = !(state.range === "quarterly" || state.range === "monthly");
      if (yearLabel) yearLabel.textContent = "Period";
      yearInput.setAttribute("aria-label", state.range === "fiscal_year" ? "Select fiscal year" : "Select trend year");
      rangeSelect.value = state.range;
      syncRangeButtons();

      if (state.range === "quarterly") {
        if (periodLabel) periodLabel.textContent = "Quarter";
        state.activeQuarter = setSelectOptions(periodSelect, quarterOptions, state.activeQuarter);
        periodSelect.setAttribute("aria-label", "Select trend quarter");
      } else if (state.range === "monthly") {
        if (periodLabel) periodLabel.textContent = "Month";
        state.activeMonth = setSelectOptions(periodSelect, monthOptions, state.activeMonth);
        periodSelect.setAttribute("aria-label", "Select trend month");
      }
    };

    const getActivePeriodKey = () => {
      if (state.range === "quarterly") return state.activeQuarter;
      if (state.range === "monthly") return state.activeMonth;
      return null;
    };

    const render = () => {
      syncTrendControls();
      const periodData = getPeriodData(state.range, state.activeYear, getActivePeriodKey());

      setText("trendSelectedPeriod", periodData.label || `${rangeLabels[state.range] || "Yearly"} | ${state.activeYear}`);
      renderCharts(periodData.points, periodData.closingStatus);

      $("trendPrevYearBtn")?.toggleAttribute("disabled", state.activeYear <= minYear);
      $("trendNextYearBtn")?.toggleAttribute("disabled", state.activeYear >= maxYear);
      state.hasRendered = true;
    };

    const setActiveYear = (nextYear) => {
      const normalizedYear = clamp(Number(nextYear) || DEFAULT_YEAR, minYear, maxYear);
      state.activeYear = normalizedYear;
      yearInput.value = String(normalizedYear);
      resetStatusDrill();
      if (state.isTrendsVisible) render();
    };

    const setActiveRange = (nextRange) => {
      state.range = rangeLabels[nextRange] ? nextRange : "yearly";
      resetStatusDrill();
      syncTrendControls();
      if (state.isTrendsVisible) render();
    };

    const setTrendVisibility = (showTrends) => {
      state.isTrendsVisible = showTrends;
      if (nowTopGrid) nowTopGrid.hidden = showTrends;
      nowGrid.hidden = showTrends;
      trendView.hidden = !showTrends;
      toggleBtn.setAttribute("aria-pressed", showTrends ? "true" : "false");
      toggleBtn.title = showTrends ? "Now" : "Trends";
      toggleBtn.setAttribute("aria-label", showTrends ? "Show current dashboard cards" : "Show performance trends");
      const textNode = toggleBtn.querySelector("[data-trend-toggle-text]");
      if (textNode) textNode.textContent = showTrends ? "Now" : "Trends";

      if (showTrends) {
        requestAnimationFrame(() => {
          if (!state.hasRendered) render();
          else Object.values(chartInstances).forEach((chart) => chart?.resize());
          markTrendsVisible();
        });
      } else {
        window.dispatchEvent(new Event("resize"));
      }
    };

    toggleBtn.addEventListener("click", () => setTrendVisibility(!state.isTrendsVisible));
    yearInput.addEventListener("change", (event) => setActiveYear(event.target.value));
    rangeSelect.addEventListener("change", (event) => setActiveRange(event.target.value));
    rangeButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveRange(button.dataset.trendRange));
    });
    periodSelect.addEventListener("change", (event) => {
      if (state.range === "quarterly") state.activeQuarter = event.target.value || CURRENT_QUARTER_KEY;
      if (state.range === "monthly") state.activeMonth = event.target.value || CURRENT_MONTH_KEY;
      resetStatusDrill();
      if (state.isTrendsVisible) render();
    });
    $("trendPrevYearBtn")?.addEventListener("click", () => setActiveYear(state.activeYear - 1));
    $("trendNextYearBtn")?.addEventListener("click", () => setActiveYear(state.activeYear + 1));
    $("trendActivityPrimaryBtn")?.addEventListener("click", () => {
      currentStatusDrill.activity = null;
      renderStatusPies(currentStatusSnapshot);
    });
    $("trendIssuePrimaryBtn")?.addEventListener("click", () => {
      currentStatusDrill.issue = null;
      renderStatusPies(currentStatusSnapshot);
    });
    syncTrendControls();
    setTrendVisibility(toggleBtn.getAttribute("aria-pressed") === "true" || !trendView.hidden);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
