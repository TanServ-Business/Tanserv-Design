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
  const trendEchartInstances = {};
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
  const collectionFilterDefinitions = [
    { key: "agent", label: "Agent" },
    { key: "manager", label: "Manager" },
    { key: "kam", label: "KAM" },
    { key: "kas", label: "KAS" },
    { key: "city", label: "City" },
    { key: "customerName", label: "Customer" },
    { key: "dueStatus", label: "Due / Not Due" }
  ];
  const planPortfolioFilterDefinitions = [
    ...collectionFilterDefinitions,
    { key: "customerCategory", label: "Customer category" }
  ];
  const invoiceSubmissionFilterDefinitions = collectionFilterDefinitions.filter(({ key }) => key !== "city" && key !== "dueStatus");
  const agingBucketsFilterDefinitions = collectionFilterDefinitions.filter(({ key }) => key !== "city" && key !== "dueStatus");
  const cnAdvFilterDefinitions = collectionFilterDefinitions.filter(({ key }) => key !== "city" && key !== "dueStatus");
  const financialRiskFilterDefinitions = collectionFilterDefinitions.filter(({ key }) => key !== "city" && key !== "dueStatus");
  const visitsFilterDefinitions = collectionFilterDefinitions.filter(({ key }) => key !== "city" && key !== "customerName");
  const visitsAllFilterDefinitions = [
    ...visitsFilterDefinitions,
    { key: "customerName", label: "Customer" }
  ];
  const collectionDimensionProfiles = [
    { customerId: "CUST-001", customerName: "Apollo Pharmacy Pvt Ltd", customerCategory: "Private", city: "Mumbai", manager: "Rohit Malhotra", kam: "Sakshi Sharma", kas: "Ravi Singh", agent: "Devashish Agent1" },
    { customerId: "CUST-007", customerName: "Blue Star Limited", customerCategory: "Distributor", city: "Pune", manager: "Rohit Malhotra", kam: "Sakshi Sharma", kas: "Priya Nair", agent: "Neha Gupta" },
    { customerId: "CUST-013", customerName: "Varun Beverages", customerCategory: "Private", city: "Delhi", manager: "Rohit Malhotra", kam: "Abhishek Sharma", kas: "Ankit Verma", agent: "Riya Nair" },
    { customerId: "CUST-021", customerName: "Shiva Healthcare Pvt Ltd", customerCategory: "Public", city: "Bengaluru", manager: "Mukesh Mishra", kam: "Palak Choudhary", kas: "Manish Kumar", agent: "Vikram Das" },
    { customerId: "CUST-034", customerName: "Mediport Labs", customerCategory: "SKAM", city: "Chennai", manager: "Mukesh Mishra", kam: "Palak Choudhary", kas: "Manish Kumar", agent: "Megha Arora" },
    { customerId: "CUST-066", customerName: "Pulse Diagnostics", customerCategory: "Govt", city: "Hyderabad", manager: "Rohit Malhotra", kam: "Sakshi Sharma", kas: "Ravi Singh", agent: "Sagar Patel" },
    { customerId: "CUST-072", customerName: "Lifecrest Hospitals", customerCategory: "Private", city: "Mumbai", manager: "Rohit Malhotra", kam: "Sakshi Sharma", kas: "Priya Nair", agent: "Nisha Verma" },
    { customerId: "CUST-041", customerName: "Zen Meditech", customerCategory: "Distributor", city: "Pune", manager: "Rohit Malhotra", kam: "Abhishek Sharma", kas: "Ankit Verma", agent: "Aditi Sharma" },
    { customerId: "CUST-056", customerName: "Skyline Healthcare", customerCategory: "SKAM", city: "Delhi", manager: "Rohit Malhotra", kam: "Abhishek Sharma", kas: "Ankit Verma", agent: "Sakshi Sharma" },
    { customerId: "CUST-045", customerName: "Careline Pharma", customerCategory: "Public", city: "Bengaluru", manager: "Mukesh Mishra", kam: "Palak Choudhary", kas: "Manish Kumar", agent: "Abhishek Sharma" }
  ];
  const additionalCustomerNames = [
    "Aster Medical Systems", "Brightline Diagnostics", "Crestview Healthcare", "Dhanvantari Clinics",
    "Evercare Medical Centre", "Fortis Surgical Supplies", "Greenfield Hospitals", "Helix Life Sciences",
    "Indus Health Network", "Jupiter Care Solutions", "Kaveri Diagnostics", "Lighthouse Pharma",
    "Meridian Hospitals", "Nexgen Medisystems", "Orchid Healthcare", "Primecare Clinics",
    "Quantum Health Services", "Radiant Medicals", "Sapphire Diagnostics", "Trinity Hospitals",
    "Unity Healthcare", "Vertex Life Sciences", "Wellness First Hospitals", "Xcell Medical Centre",
    "Yashoda Health Systems", "Zenith Care Network"
  ];
  const additionalCities = ["Mumbai", "Pune", "Delhi", "Bengaluru", "Chennai", "Hyderabad"];
  const additionalManagers = ["Rohit Malhotra", "Mukesh Mishra"];
  const additionalKams = ["Sakshi Sharma", "Abhishek Sharma", "Palak Choudhary"];
  const additionalKas = ["Ravi Singh", "Priya Nair", "Ankit Verma", "Manish Kumar"];
  const additionalAgents = ["Devashish Agent1", "Neha Gupta", "Riya Nair", "Vikram Das", "Megha Arora", "Sagar Patel", "Nisha Verma", "Aditi Sharma", "Sakshi Sharma", "Abhishek Sharma"];
  const customerCategories = ["Public", "Private", "SKAM", "Distributor", "Govt"];
  collectionDimensionProfiles.push(...additionalCustomerNames.map((customerName, index) => ({
    customerId: `CUST-${String(101 + index).padStart(3, "0")}`,
    customerName,
    customerCategory: customerCategories[index % customerCategories.length],
    city: additionalCities[index % additionalCities.length],
    manager: additionalManagers[index % additionalManagers.length],
    kam: additionalKams[index % additionalKams.length],
    kas: additionalKas[index % additionalKas.length],
    agent: additionalAgents[index % additionalAgents.length]
  })));
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

  const distributeAmount = (total, weights, decimals = 2) => {
    const multiplier = 10 ** decimals;
    return distributeInteger(Math.round(Number(total || 0) * multiplier), weights)
      .map((value) => value / multiplier);
  };

  const makeCollectionBreakdown = (index, collectedCr, newBillingCr, ptpTargetCr, planCr, portfolioCr, monthlyVisits, submissionChannels = {}, agingBuckets = {}, cnAdv = {}, financialRisk = {}) => {
    const rows = collectionDimensionProfiles.flatMap((profile, profileIndex) => (
      ["Due", "Not Due"].map((dueStatus, dueIndex) => ({
        ...profile,
        dueStatus,
        seed: (profileIndex * 2) + dueIndex
      }))
    ));
    const collectionWeights = rows.map((row) => (
      1 + (row.seed * 0.045) + (row.dueStatus === "Due" ? 0.38 : 0.08) + (Math.sin((index + row.seed) / 3.2) * 0.12)
    ));
    const billingWeights = rows.map((row) => (
      1 + (((row.seed + 2) % 7) * 0.055) + (row.dueStatus === "Not Due" ? 0.24 : 0.06) + (Math.cos((index + row.seed) / 4.1) * 0.1)
    ));
    const ptpWeights = rows.map((row) => (
      1 + (((row.seed + 4) % 5) * 0.07) + (row.dueStatus === "Due" ? 0.5 : 0.04) + (Math.sin((index + row.seed) / 5.3) * 0.09)
    ));
    const planWeights = rows.map((row) => (
      1 + ((row.seed % 6) * 0.06) + (row.dueStatus === "Due" ? 0.28 : 0.12) + (Math.cos((index + row.seed) / 4.4) * 0.08)
    ));
    const portfolioWeights = rows.map((row) => (
      1 + (((row.seed + 3) % 8) * 0.05) + (row.dueStatus === "Due" ? 0.44 : 0.16) + (Math.sin((index + row.seed) / 4.8) * 0.1)
    ));
    const activeVisitCustomerCount = 27 + (index % 7);
    const activeVisitCustomerStart = (index * 5) % collectionDimensionProfiles.length;
    const activeVisitCustomerIndexes = new Set(Array.from({ length: activeVisitCustomerCount }, (_, activeIndex) => (
      (activeVisitCustomerStart + activeIndex) % collectionDimensionProfiles.length
    )));
    const collectionValues = distributeAmount(collectedCr, collectionWeights);
    const billingValues = distributeAmount(newBillingCr, billingWeights);
    const ptpValues = distributeAmount(ptpTargetCr, ptpWeights);
    const planValues = distributeAmount(planCr, planWeights);
    const portfolioValues = distributeAmount(portfolioCr, portfolioWeights);
    const submissionChannelValues = Object.keys(submissionChannelLabels).reduce((acc, channel, channelIndex) => {
      acc[channel] = distributeInteger(submissionChannels[channel] || 0, rows.map((row) => (
        1 + ((row.seed + channelIndex) % 7) * 0.06 + (row.dueStatus === "Due" ? 0.16 : 0.08)
      )));
      return acc;
    }, {});
    const agingBucketValues = ["0-30", "31-60", "61-90", "90+"].reduce((acc, bucket, bucketIndex) => {
      acc[bucket] = distributeAmount(agingBuckets[bucket] || 0, rows.map((row) => (
        1 + ((row.seed + bucketIndex) % 8) * 0.055 + (row.dueStatus === "Due" ? 0.34 : 0.12)
      )));
      return acc;
    }, {});
    const cnAdvValues = ["addedCr", "utilisedCr"].reduce((acc, key, metricIndex) => {
      acc[key] = distributeAmount(cnAdv[key] || 0, rows.map((row) => (
        1 + ((row.seed + metricIndex) % 8) * 0.055 + (row.dueStatus === "Due" ? 0.22 : 0.11)
      )));
      return acc;
    }, {});
    const financialRiskValues = ["provisioningCr", "writtenOffCr"].reduce((acc, key, metricIndex) => {
      acc[key] = distributeAmount(financialRisk[key] || 0, rows.map((row) => (
        1 + ((row.seed + metricIndex) % 7) * 0.06 + (row.dueStatus === "Due" ? 0.36 : 0.09)
      )));
      return acc;
    }, {});
    const activeVisitRows = rows
      .map((row, rowIndex) => ({ row, rowIndex, profileIndex: Math.floor(row.seed / 2) }))
      .filter(({ profileIndex }) => activeVisitCustomerIndexes.has(profileIndex));
    const activeVisitValues = distributeInteger(monthlyVisits, activeVisitRows.map(({ row }) => (
      1 + ((row.seed % 5) * 0.08) + (row.dueStatus === "Due" ? 0.22 : 0.1) + (Math.cos((index + row.seed) / 3.8) * 0.1)
    )));
    const visitValues = rows.map(() => 0);
    activeVisitRows.forEach(({ rowIndex }, activeIndex) => {
      visitValues[rowIndex] = activeVisitValues[activeIndex] || 0;
    });

    return rows.map(({ seed, ...row }, rowIndex) => ({
      ...row,
      collectionCr: collectionValues[rowIndex] || 0,
      newBillingCr: billingValues[rowIndex] || 0,
      ptpTargetCr: ptpValues[rowIndex] || 0,
      planCr: planValues[rowIndex] || 0,
      portfolioCr: portfolioValues[rowIndex] || 0,
      monthlyVisits: visitValues[rowIndex] || 0,
      submissionChannels: Object.keys(submissionChannelLabels).reduce((acc, channel) => {
        acc[channel] = submissionChannelValues[channel]?.[rowIndex] || 0;
        return acc;
      }, {}),
      agingBuckets: ["0-30", "31-60", "61-90", "90+"].reduce((acc, bucket) => {
        acc[bucket] = agingBucketValues[bucket]?.[rowIndex] || 0;
        return acc;
      }, {}),
      cnAdv: ["addedCr", "utilisedCr"].reduce((acc, key) => {
        acc[key] = cnAdvValues[key]?.[rowIndex] || 0;
        return acc;
      }, {}),
      provisioningCr: financialRiskValues.provisioningCr?.[rowIndex] || 0,
      writtenOffCr: financialRiskValues.writtenOffCr?.[rowIndex] || 0
    }));
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

  const makeTeamRows = (index, targetCr, collectedCr, ptpKept, resolvedIssues) => {
    const names = ["Ravi Singh", "Palak Choudhary", "Sakshi Sharma", "Abhishek Sharma", "Priya Nair", "Ankit Verma", "Manish Kumar", "Neha Gupta"];
    return names.map((name, itemIndex) => {
      const factor = 1 - (itemIndex * 0.07) + (((index + itemIndex) % 3) * 0.025);
      return {
        name,
        committedCr: round(targetCr * 0.16 * factor, 2),
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
    const planCr = round(collectedCr * 0.79, 2);
    const monthlyVisits = 118 + ((index * 9) % 52);
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
    const cnAdvAddedCr = round(
      (newBillingCr * (0.035 + ((index % 5) * 0.007)))
        + (collectedCr * (0.09 + (Math.sin(index / 3.7) * 0.018) + ((index % 4) * 0.006))),
      2
    );
    // Utilisation can include a carried-forward CN/ADV balance, so it may exceed current-period additions.
    const cnAdvUtilisedCr = round(cnAdvAddedCr * (0.68 + ((index % 8) * 0.09) + (Math.cos(index / 4.2) * 0.04)), 2);
    const provisioningCr = round(overdueCr * (0.18 + ((index % 5) * 0.012) + (Math.sin(index / 4.7) * 0.014)), 2);
    const writtenOffCr = round(provisioningCr * (0.12 + ((index % 4) * 0.018) + (Math.cos(index / 5.1) * 0.01)), 2);
    const activityStatusTotal = Math.max(24, Math.round(invoiceCount * (0.7 + ((index % 4) * 0.04))));

    return {
      trendIndex: index,
      month: Number(key.slice(5, 7)),
      year: Number(key.slice(0, 4)),
      quarter: `Q${Math.floor((((Number(key.slice(5, 7)) + 8) % 12) / 3)) + 1}`,
      financialYear: fiscalYearLabel(key),
      dataSource: isGeneratedExtension ? "generated_extension" : "available_seed",
      collectionBreakdown: makeCollectionBreakdown(index, collectedCr, newBillingCr, ptpAmountCr, planCr, currentOutstandingCr, monthlyVisits, submissionChannels, agingBuckets, { addedCr: cnAdvAddedCr, utilisedCr: cnAdvUtilisedCr }, { provisioningCr, writtenOffCr }),
      collections: {
        collectedCr,
        targetCr,
        achievementPct: targetCr > 0 ? round((collectedCr / targetCr) * 100, 1) : 0,
        efficiencyPct: round(72 + ((index % 9) * 1.3) + (Math.sin(index / 4) * 2.4), 1)
      },
      plan: {
        committedCr: planCr
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
      cnAdv: {
        addedCr: cnAdvAddedCr,
        utilisedCr: cnAdvUtilisedCr
      },
      financialRisk: {
        provisioningCr,
        writtenOffCr
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
        visits: monthlyVisits,
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
      teamPerformance: makeTeamRows(index, targetCr, collectedCr, ptpKept, resolvedIssues),
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
    const cnAdvAddedCr = round(source.reduce((sum, record) => sum + (record.cnAdv?.addedCr || 0), 0), 2);
    const cnAdvUtilisedCr = round(source.reduce((sum, record) => sum + (record.cnAdv?.utilisedCr || 0), 0), 2);
    const provisioningCr = round(source.reduce((sum, record) => sum + (record.financialRisk?.provisioningCr || 0), 0), 2);
    const writtenOffCr = round(source.reduce((sum, record) => sum + (record.financialRisk?.writtenOffCr || 0), 0), 2);
    const visits = source.reduce((sum, record) => sum + (record.productivity?.visits || 0), 0);
    const agingBuckets = ["0-30", "31-60", "61-90", "90+"].reduce((acc, bucket) => {
      acc[bucket] = round(source.reduce((sum, record) => sum + (record.aging.buckets[bucket] || 0), 0), 2);
      return acc;
    }, {});
    const teamPerformance = Object.values(source.reduce((acc, record) => {
      record.teamPerformance.forEach((row) => {
        acc[row.name] = acc[row.name] || { name: row.name, committedCr: 0, collectedCr: 0 };
        acc[row.name].committedCr = round(acc[row.name].committedCr + (row.committedCr || 0), 2);
        acc[row.name].collectedCr = round(acc[row.name].collectedCr + row.collectedCr, 2);
      });
      return acc;
    }, {})).sort((a, b) => b.collectedCr - a.collectedCr);
    const collectionBreakdown = source.flatMap((record) => record.collectionBreakdown || []);

    return {
      label,
      collectionBreakdown,
      collections: { collectedCr, targetCr },
      plan: { committedCr: round(source.reduce((sum, record) => sum + (record.plan?.committedCr || 0), 0), 2) },
      ptp: { amountCr: ptpAmountCr, collectedCr: ptpCollectedCr },
      issues: {
        raised: source.reduce((sum, record) => sum + record.issues.raised, 0),
        resolved: source.reduce((sum, record) => sum + record.issues.resolved, 0)
      },
      billing: { newBillingCr: billingCr, invoiceCount, submittedCount, submissionChannels },
      cnAdv: { addedCr: cnAdvAddedCr, utilisedCr: cnAdvUtilisedCr },
      financialRisk: { provisioningCr, writtenOffCr },
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
    cnAdv: {
      addedCr: round((record.cnAdv?.addedCr || 0) * share, 2),
      utilisedCr: round((record.cnAdv?.utilisedCr || 0) * share, 2)
    },
    financialRisk: {
      provisioningCr: round((record.financialRisk?.provisioningCr || 0) * share, 2),
      writtenOffCr: round((record.financialRisk?.writtenOffCr || 0) * share, 2)
    },
    productivity: {
      visits: Math.max(0, Math.round(record.productivity.visits * share))
    },
    aging: {
      buckets: makeAgingBucketSplit(record.aging.overdueCr, agingSeed)
    },
    teamPerformance: record.teamPerformance.map((row) => ({
      name: row.name,
      committedCr: round((row.committedCr || 0) * share, 2),
      collectedCr: round(row.collectedCr * share, 2)
    })),
    collectionBreakdown: (record.collectionBreakdown || []).map((row) => ({
      ...row,
      collectionCr: round(row.collectionCr * share, 4),
      newBillingCr: round(row.newBillingCr * share, 4),
      ptpTargetCr: round(row.ptpTargetCr * share, 4),
      planCr: round(row.planCr * share, 4),
      portfolioCr: round(row.portfolioCr * share, 4),
      monthlyVisits: Math.max(0, Math.round(row.monthlyVisits * share)),
      submissionChannels: Object.keys(submissionChannelLabels).reduce((acc, channel) => {
        acc[channel] = Math.max(0, Math.round((row.submissionChannels?.[channel] || 0) * share));
        return acc;
      }, {}),
      agingBuckets: ["0-30", "31-60", "61-90", "90+"].reduce((acc, bucket) => {
        acc[bucket] = round((row.agingBuckets?.[bucket] || 0) * share, 4);
        return acc;
      }, {}),
      cnAdv: ["addedCr", "utilisedCr"].reduce((acc, key) => {
        acc[key] = round((row.cnAdv?.[key] || 0) * share, 4);
        return acc;
      }, {}),
      provisioningCr: round((row.provisioningCr || 0) * share, 4),
      writtenOffCr: round((row.writtenOffCr || 0) * share, 4)
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

  const getPeriodData = (range, activeYear, activePeriodKey, activePeriodKeys = null) => {
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

    if (Array.isArray(activePeriodKeys) && activePeriodKeys.length) {
      const selectedKeys = [...new Set(activePeriodKeys)];

      if (range === "monthly") {
        const monthKeys = selectedKeys.filter((key) => trendHistoryData.months[key]).sort();
        const records = monthKeys.map((key) => trendHistoryData.months[key]).filter(Boolean);
        const points = monthKeys.flatMap((key) => makeDailyPoints(key));
        const lastMonthKey = monthKeys[monthKeys.length - 1] || CURRENT_MONTH_KEY;
        const lastVisibleDay = lastMonthKey === CURRENT_MONTH_KEY
          ? Math.min(CURRENT_DAY, getDaysInMonth(lastMonthKey))
          : getDaysInMonth(lastMonthKey);
        return {
          records,
          points,
          label: `Monthly | ${monthKeys.length} month${monthKeys.length === 1 ? "" : "s"} | ${getRangeLabel(monthKeys, CURRENT_MONTH_KEY)}`,
          closingStatus: makeDailyClosingStatus(lastMonthKey, lastVisibleDay)
        };
      }

      const monthKeys = selectedKeys.flatMap((key) => {
        if (range === "yearly") return getYearKeys(Number(key));
        if (range === "fiscal_year") return getFiscalYearKeys(Number(key));
        if (range === "quarterly") return getQuarterKeys(key);
        return [];
      }).filter((key, index, keys) => keys.indexOf(key) === index).sort();
      const records = monthKeys.map((key) => trendHistoryData.months[key]).filter(Boolean);
      const points = monthKeys
        .map((key) => makeTrendPoint(formatMonthLabel(key, true), [trendHistoryData.months[key]]))
        .filter((point) => point.collections.targetCr > 0);
      const rangeName = range === "fiscal_year" ? "Fiscal Year" : rangeLabels[range] || "Yearly";
      const selectedLabel = selectedKeys.length === 1
        ? (range === "quarterly" ? formatQuarterLabel(selectedKeys[0]) : String(selectedKeys[0]))
        : `${selectedKeys.length} selected`;
      const lastMonthKey = monthKeys[monthKeys.length - 1] || CURRENT_MONTH_KEY;
      return {
        records,
        points,
        label: `${rangeName} | ${selectedLabel} | ${getRangeLabel(monthKeys, CURRENT_MONTH_KEY)}`,
        closingStatus: makeClosingStatusFromRecords(records.slice(-1), formatMonthLabel(lastMonthKey))
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
    layout: {
      padding: { top: 8, right: 16, bottom: 20, left: 12 }
    },
    plugins: {
      legend: {
        display: false,
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
        padding: 10,
        callbacks: {
          title: (items) => items?.[0]?.label || "Month",
          label: (context) => {
            const rawValue = context?.parsed?.y ?? context?.parsed ?? context?.raw ?? 0;
            const value = Number(rawValue);
            const displayValue = Number.isFinite(value)
              ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
              : String(rawValue ?? "0");
            return `${context?.dataset?.label || "Data"}: ${displayValue}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: {
          color: "#64748b",
          font: { size: 10 },
          padding: 10,
          autoSkip: true,
          maxTicksLimit: 8,
          minRotation: 0,
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148, 163, 184, 0.18)" },
        ticks: { color: "#64748b", font: { size: 10 }, padding: 8 }
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

  const usesTrendEcharts = (id) => Boolean(window.echarts && $(id)?.classList.contains("trendEchartCanvas"));

  const setTrendEchart = (id, option) => {
    const node = $(id);
    if (!usesTrendEcharts(id) || !node) return;
    const instance = trendEchartInstances[id] || window.echarts.init(node, null, { renderer: "canvas" });
    trendEchartInstances[id] = instance;
    instance.setOption(option, { notMerge: true, lazyUpdate: true });
  };

  const trendEchartOption = ({ labels, series, valueFormatter = formatCount, suffix = "", axisName = "Count", bars = false, stacked = false, tooltipFooter = null }) => ({
    animationDuration: 260,
    animationEasing: "cubicOut",
    grid: { left: 10, right: 12, top: 12, bottom: 8, containLabel: true },
    legend: {
      show: false,
      top: 4,
      left: "center",
      selectedMode: false,
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 12,
      textStyle: { color: "#475569", fontSize: 10, fontWeight: 700 }
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", crossStyle: { color: "#94a3b8" }, lineStyle: { color: "#94a3b8", type: "dashed" } },
      backgroundColor: "#2e1065",
      borderWidth: 0,
      padding: [9, 11],
      textStyle: { color: "#ffffff", fontSize: 11 },
      formatter: (params) => {
        const rows = params.map((item) => `${item.marker} ${item.seriesName}: <b>${valueFormatter(item.value)}${suffix}</b>`).join("<br/>");
        const footer = typeof tooltipFooter === "function" ? tooltipFooter(params) : "";
        return `<b>${params[0]?.axisValueLabel || "Period"}</b><br/>${rows}${footer ? `<br/>${footer}` : ""}`;
      }
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: bars,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#cbd5e1" } },
      axisLabel: { color: "#64748b", fontSize: 10, margin: 10, hideOverlap: true },
      splitLine: { show: false }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: suffix === "%" ? 100 : null,
      name: axisName,
      nameTextStyle: { color: "#64748b", fontSize: 10, fontWeight: 700, padding: [0, 0, 0, 2] },
      nameGap: 8,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (value) => `${valueFormatter(value)}${suffix}` },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.18)" } }
    },
    series: series.map((item) => ({
      ...item,
      smooth: item.type === "line" ? 0.28 : undefined,
      symbol: item.type === "line" ? (item.symbol || "circle") : undefined,
      symbolSize: item.type === "line" ? (item.symbolSize || 7) : undefined,
      showSymbol: item.type === "line",
      lineStyle: item.type === "line" ? { width: item.lineWidth || item.lineStyle?.width || 3, ...(item.lineStyle || {}) } : undefined,
      itemStyle: { borderRadius: item.type === "bar" ? [4, 4, 0, 0] : undefined, ...(item.itemStyle || {}) },
      emphasis: { focus: "series" },
      stack: stacked ? (item.stack || "trend-stack") : undefined
    }))
  });

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
    const safePoints = points || [];
    const totals = getPointTotals(safePoints);
    const lastPoint = safePoints[safePoints.length - 1] || {};
    const latestLabel = lastPoint.label || "Latest";
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
        values: safePoints.map((point) => point.collections.collectedCr),
        formatValue: formatCr,
        sparkColor: "#bfdbfe",
        details: [
          { label: `${latestLabel} collection`, value: formatCr(lastPoint.collections?.collectedCr || 0) },
          { label: "Total collection", value: formatCr(totals.collectionCr) },
          { label: "Achievement", value: formatPct(collectionPct) }
        ]
      },
      {
        icon: "bi-bezier2",
        color: "#16a34a",
        rgb: "22, 163, 74",
        label: "PTP Conversion",
        value: formatPct(ptpPct),
        meta: "of committed",
        values: safePoints.map((point) => point.ptp.collectedCr),
        formatValue: formatCr,
        sparkColor: "#bbf7d0",
        details: [
          { label: `${latestLabel} collected`, value: formatCr(lastPoint.ptp?.collectedCr || 0) },
          { label: "Committed PTP", value: formatCr(totals.ptpCommittedCr) },
          { label: "Conversion", value: formatPct(ptpPct) }
        ]
      },
      {
        icon: "bi-tools",
        color: "#d97706",
        rgb: "217, 119, 6",
        label: "Issue Closure",
        value: formatPct(issuePct),
        meta: `${formatCount(issueGap)} open gap`,
        values: safePoints.map((point) => point.issues.resolved),
        formatValue: (value) => `${formatCount(value)} resolved`,
        sparkColor: "#fed7aa",
        details: [
          { label: `${latestLabel} resolved`, value: formatCount(lastPoint.issues?.resolved || 0) },
          { label: `${latestLabel} reported`, value: formatCount(lastPoint.issues?.raised || 0) },
          { label: "Open gap", value: formatCount(issueGap) }
        ]
      },
      {
        icon: "bi-envelope-check",
        color: "#5c258d",
        rgb: "92, 37, 141",
        label: "Invoice Submission",
        value: formatPct(submissionPct),
        meta: `${formatCount(pendingInvoices)} pending`,
        values: safePoints.map((point) => point.billing.submittedCount),
        formatValue: (value) => `${formatCount(value)} submitted`,
        sparkColor: "#ddd6fe",
        details: [
          { label: `${latestLabel} submitted`, value: formatCount(lastPoint.billing?.submittedCount || 0) },
          { label: "Total invoices", value: formatCount(totals.invoices) },
          { label: "Pending", value: formatCount(pendingInvoices) }
        ]
      }
    ];
    const sparkLabels = safePoints.map((point) => point.label);

    grid.innerHTML = cards.map((card) => `
      <article class="trendInsightMetric" tabindex="0" aria-label="${escapeHtml(`${card.label}: ${card.value}, ${card.meta}. ${card.details.map((row) => `${row.label}: ${row.value}`).join(". ")}`)}" style="--trend-insight-color:${card.color}; --trend-insight-rgb:${card.rgb}">
        <span class="trendInsightIcon"><i class="bi ${card.icon}" aria-hidden="true"></i></span>
        <div>
          <div class="trendInsightLabel">${card.label}</div>
          <div class="trendInsightValue">${card.value}</div>
          <div class="trendInsightMeta">${card.meta}</div>
        </div>
        ${renderSparkLine({ values: card.values, labels: sparkLabels, color: card.sparkColor, formatValue: card.formatValue })}
        <div class="trendInsightHoverPanel" role="presentation">
          <strong>${escapeHtml(card.label)}</strong>
          ${card.details.map((row) => `
            <span>
              <em>${escapeHtml(row.label)}</em>
              <b>${escapeHtml(row.value)}</b>
            </span>
          `).join("")}
        </div>
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

  const getCollectionFilterCatalog = (points, key) => [...new Set(
    points.flatMap((point) => (point.collectionBreakdown || []).map((row) => row[key])).filter(Boolean)
  )].sort((left, right) => String(left).localeCompare(String(right)));

  const collectionRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => collectionFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredCollectionPoints = (points, filters, enabledFilters = null) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => collectionRowMatches(row, filters, null, enabledFilters));
    return {
      label: point.label,
      rowCount: rows.length,
      collectionCr: round(rows.reduce((sum, row) => sum + Number(row.collectionCr || 0), 0), 2),
      newBillingCr: round(rows.reduce((sum, row) => sum + Number(row.newBillingCr || 0), 0), 2),
      ptpTargetCr: round(rows.reduce((sum, row) => sum + Number(row.ptpTargetCr || 0), 0), 2)
    };
  });

  const comparisonPalette = [
    { primary: "#1677ff", secondary: "#93c5fd", soft: "rgba(22, 119, 255, 0.12)" },
    { primary: "#d94801", secondary: "#fdba74", soft: "rgba(217, 72, 1, 0.12)" }
  ];

  const getComparisonGroups = (context) => {
    if (!context?.comparison?.enabled) return [];
    const groups = (context.comparison.groups || []).filter((group) => (
      Object.values(group?.filters || {}).some((values) => values instanceof Set && values.size > 0)
    ));
    return groups.length === 2 ? groups.slice(0, 2) : [];
  };

  const getComparisonGroupLabel = (group, definitions = []) => {
    const labels = definitions.flatMap(({ key, label }) => {
      const values = [...(group?.filters?.[key] || [])];
      if (!values.length) return [];
      return `${label}: ${values.length === 1 ? values[0] : `${values.length} selected`}`;
    });
    return labels.join(" | ");
  };

  const getComparisonContexts = (context, definitions = []) => getComparisonGroups(context).map((group, index) => {
    const cohortFilters = Object.fromEntries(Object.entries(group.filters || {}).filter(([, values]) => values instanceof Set && values.size));
    return {
      group,
      index,
      label: getComparisonGroupLabel(group, definitions),
      context: {
        ...context,
        filters: { ...(context.filters || {}), ...cohortFilters },
        enabledFilters: {
          ...(context.enabledFilters || {}),
          ...Object.fromEntries(Object.keys(cohortFilters).map((key) => [key, true]))
        }
      },
      palette: comparisonPalette[index]
    };
  });

  const getTrendComparisonPoints = (points, context, definitions, getFilteredPoints) => {
    const periodGroups = context?.periodComparison?.groups || [];
    if (periodGroups.length === 2) {
      return periodGroups.map((group, index) => ({
        label: group.label,
        index,
        palette: comparisonPalette[index],
        points: getFilteredPoints(group.points, context.filters, context.enabledFilters)
      }));
    }
    return getComparisonContexts(context, definitions).map((item) => ({
      ...item,
      points: getFilteredPoints(points, item.context.filters, item.context.enabledFilters)
    }));
  };

  const getTrendComparisonLabels = (points, context) => {
    const periodGroups = context?.periodComparison?.groups || [];
    if (periodGroups.length === 2 && context?.periodComparison?.range === "quarterly") {
      const length = Math.max(...periodGroups.map((group) => group.points.length));
      return Array.from({ length }, (_, index) => `Month ${index + 1}`);
    }
    if (periodGroups.length === 2 && context?.periodComparison?.range === "monthly") {
      const length = Math.max(...periodGroups.map((group) => group.points.length));
      return Array.from({ length }, (_, index) => `Day ${index + 1}`);
    }
    const source = periodGroups.length === 2
      ? periodGroups.reduce((longest, group) => group.points.length > longest.length ? group.points : longest, [])
      : points;
    return source.map((point) => periodGroups.length === 2
      ? point.label.replace(/\s+\d{2,4}$/, "")
      : point.label);
  };

  const invoiceSubmissionRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => invoiceSubmissionFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredInvoiceSubmissionPoints = (points, filters, enabledFilters = null) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => invoiceSubmissionRowMatches(row, filters, null, enabledFilters));
    const submissionChannels = Object.keys(submissionChannelLabels).reduce((acc, channel) => {
      acc[channel] = rows.reduce((sum, row) => sum + Number(row.submissionChannels?.[channel] || 0), 0);
      return acc;
    }, {});
    return { label: point.label, rowCount: rows.length, submissionChannels };
  });

  const renderInvoiceSubmissionChart = (points, context = null) => {
    if (!context) return { hasData: false, filteredPoints: [] };
    const filteredPoints = getFilteredInvoiceSubmissionPoints(points, context.filters, context.enabledFilters);
    const comparisonPoints = getTrendComparisonPoints(points, context, invoiceSubmissionFilterDefinitions, getFilteredInvoiceSubmissionPoints);
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => Object.values(point.submissionChannels).some((value) => value > 0)))
      : filteredPoints.some((point) => Object.values(point.submissionChannels).some((value) => value > 0));
    if (usesTrendEcharts("trendInvoiceSubmissionChart")) {
      setTrendEchart("trendInvoiceSubmissionChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        axisName: "Count",
        bars: true,
        stacked: true,
        series: comparisonPoints.length ? comparisonPoints.flatMap(({ label: groupLabel, index, points: groupPoints }) => Object.entries(submissionChannelLabels).map(([channel, label]) => ({
          name: `${groupLabel} · ${label}`,
          type: "bar",
          stack: `submission-${index}`,
          data: groupPoints.map((point) => point.submissionChannels[channel] || 0),
          barMaxWidth: 17,
          itemStyle: { color: index === 0
            ? submissionChannelColors[channel].replace(/rgba?\(([^,]+),\s*([^,]+),\s*([^,]+).*\)/, "rgb($1, $2, $3)")
            : ({ physical: "#93c5fd", courier: "#86efac", email: "#fcd34d", external: "#d8b4fe" }[channel]) }
        }))) : Object.entries(submissionChannelLabels).map(([channel, label]) => ({
          name: label,
          type: "bar",
          data: filteredPoints.map((point) => point.submissionChannels[channel] || 0),
          barMaxWidth: 28,
          itemStyle: { color: submissionChannelColors[channel].replace(/rgba?\(([^,]+),\s*([^,]+),\s*([^,]+).*\)/, "rgb($1, $2, $3)") }
        }))
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendInvoiceSubmissionChart", {
      type: "bar",
      data: {
        labels: filteredPoints.map((point) => point.label),
        datasets: Object.entries(submissionChannelLabels).map(([channel, label]) => ({
          label,
          data: filteredPoints.map((point) => point.submissionChannels[channel] || 0),
          backgroundColor: submissionChannelColors[channel],
          borderColor: submissionChannelColors[channel].replace(/0\.\d+\)/, "0.9)"),
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 30
        }))
      },
      options: buildChartOptions({
        interaction: { mode: "index", intersect: false },
        scales: { x: { stacked: true }, y: { stacked: true } }
      })
    });
    return { hasData, filteredPoints };
  };

  const agingBucketsRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => agingBucketsFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredAgingBucketPoints = (points, filters, enabledFilters = null) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => agingBucketsRowMatches(row, filters, null, enabledFilters));
    const buckets = ["0-30", "31-60", "61-90", "90+"].reduce((acc, bucket) => {
      acc[bucket] = round(rows.reduce((sum, row) => sum + Number(row.agingBuckets?.[bucket] || 0), 0), 2);
      return acc;
    }, {});
    const total = Object.values(buckets).reduce((sum, value) => sum + value, 0) || 1;
    const shares = Object.fromEntries(Object.entries(buckets).map(([bucket, value]) => [bucket, round((value / total) * 100, 1)]));
    return { label: point.label, rowCount: rows.length, buckets, shares };
  });

  const renderAgingBucketsChart = (points, context = null) => {
    if (!context) return { hasData: false, filteredPoints: [] };
    const filteredPoints = getFilteredAgingBucketPoints(points, context.filters, context.enabledFilters);
    const comparisonPoints = getTrendComparisonPoints(points, context, agingBucketsFilterDefinitions, getFilteredAgingBucketPoints);
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => Object.values(point.buckets).some((value) => value > 0)))
      : filteredPoints.some((point) => Object.values(point.buckets).some((value) => value > 0));
    if (usesTrendEcharts("trendAgingBucketsChart")) {
      const colors = { "0-30": "#2563eb", "31-60": "#16a34a", "61-90": "#f59e0b", "90+": "#ef4444" };
      setTrendEchart("trendAgingBucketsChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        valueFormatter: (value) => `Rs. ${Number(value || 0).toFixed(2)} Cr`,
        axisName: "Rs. Cr",
        bars: comparisonPoints.length > 0,
        stacked: true,
        series: comparisonPoints.length ? comparisonPoints.flatMap(({ label, index, points: groupPoints }) => Object.keys(colors).map((bucket) => ({
          name: `${label} · ${bucket}`,
          type: "bar",
          stack: `aging-${index}`,
          data: groupPoints.map((point) => point.buckets[bucket]),
          barMaxWidth: 18,
          itemStyle: { color: index === 0 ? colors[bucket] : ({ "0-30": "#93c5fd", "31-60": "#86efac", "61-90": "#fcd34d", "90+": "#fca5a5" }[bucket]) }
        }))) : Object.keys(colors).map((bucket) => ({
          name: bucket,
          type: "line",
          data: filteredPoints.map((point) => point.buckets[bucket]),
          areaStyle: { opacity: 0.7 },
          itemStyle: { color: colors[bucket] },
          lineStyle: { width: 1.4, color: colors[bucket] }
        }))
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendAgingBucketsChart", {
      type: "line",
      data: {
        labels: filteredPoints.map((point) => point.label),
        datasets: [
          { label: "0-30", data: filteredPoints.map((point) => point.buckets["0-30"]), borderColor: "#2563eb", backgroundColor: "rgba(37, 99, 235, 0.78)", borderWidth: 1.5, pointRadius: 2.5, tension: 0.35, fill: true, stack: "aging" },
          { label: "31-60", data: filteredPoints.map((point) => point.buckets["31-60"]), borderColor: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.68)", borderWidth: 1.5, pointRadius: 2.5, tension: 0.35, fill: true, stack: "aging" },
          { label: "61-90", data: filteredPoints.map((point) => point.buckets["61-90"]), borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.72)", borderWidth: 1.5, pointRadius: 2.5, tension: 0.35, fill: true, stack: "aging" },
          { label: "90+", data: filteredPoints.map((point) => point.buckets["90+"]), borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.72)", borderWidth: 1.5, pointRadius: 2.5, tension: 0.35, fill: true, stack: "aging" }
        ]
      },
      options: buildChartOptions({
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, ticks: { callback: (value) => `Rs. ${Number(value).toFixed(2)} Cr` } }
        }
      })
    });
    return { hasData, filteredPoints };
  };

  const cnAdvRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => cnAdvFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredCnAdvPoints = (points, filters, enabledFilters = null) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => cnAdvRowMatches(row, filters, null, enabledFilters));
    return {
      label: point.label,
      rowCount: rows.length,
      addedCr: round(rows.reduce((sum, row) => sum + Number(row.cnAdv?.addedCr || 0), 0), 2),
      utilisedCr: round(rows.reduce((sum, row) => sum + Number(row.cnAdv?.utilisedCr || 0), 0), 2)
    };
  });

  const renderCnAdvChart = (points, context = null) => {
    if (!context) return { hasData: false, filteredPoints: [] };
    const filteredPoints = getFilteredCnAdvPoints(points, context.filters, context.enabledFilters);
    const comparisonPoints = getTrendComparisonPoints(points, context, cnAdvFilterDefinitions, getFilteredCnAdvPoints);
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => point.addedCr > 0 || point.utilisedCr > 0))
      : filteredPoints.some((point) => point.addedCr > 0 || point.utilisedCr > 0);
    if (usesTrendEcharts("trendCnAdvChart")) {
      setTrendEchart("trendCnAdvChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        valueFormatter: (value) => `Rs. ${Number(value || 0).toFixed(2)} Cr`,
        axisName: "Rs. Cr",
        series: comparisonPoints.length ? comparisonPoints.flatMap(({ label, palette, points: groupPoints }) => [
          { name: `${label} · CN/ADV added`, type: "line", data: groupPoints.map((point) => point.addedCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 3, type: "solid" } },
          { name: `${label} · CN/ADV utilised`, type: "line", data: groupPoints.map((point) => point.utilisedCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 2.7, type: "dashed" } }
        ]) : [
          { name: "CN / ADV added", type: "line", data: filteredPoints.map((point) => point.addedCr), itemStyle: { color: "#d97706" }, lineStyle: { color: "#d97706", width: 3 } },
          { name: "CN / ADV utilised", type: "line", data: filteredPoints.map((point) => point.utilisedCr), areaStyle: { color: "rgba(8, 145, 178, 0.16)" }, itemStyle: { color: "#0891b2" }, lineStyle: { color: "#0891b2", width: 3 } }
        ]
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendCnAdvChart", {
      type: "line",
      data: {
        labels: filteredPoints.map((point) => point.label),
        datasets: [
          { label: "CN / ADV added", data: filteredPoints.map((point) => point.addedCr), borderColor: "#d97706", backgroundColor: "rgba(217, 119, 6, 0.08)", borderWidth: 2.5, pointBackgroundColor: "#d97706", pointBorderColor: "#ffffff", pointBorderWidth: 1.5, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false },
          { label: "CN / ADV utilised", data: filteredPoints.map((point) => point.utilisedCr), borderColor: "#0891b2", backgroundColor: "rgba(8, 145, 178, 0.15)", borderWidth: 2.5, pointBackgroundColor: "#0891b2", pointBorderColor: "#ffffff", pointBorderWidth: 1.5, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: true }
        ]
      },
      options: buildChartOptions({ interaction: { mode: "index", intersect: false }, scales: { y: { ticks: { callback: (value) => `Rs. ${value} Cr` } } } })
    });
    return { hasData, filteredPoints };
  };

  const financialRiskRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => financialRiskFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredFinancialRiskPoints = (points, filters, enabledFilters, metricKey) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => financialRiskRowMatches(row, filters, null, enabledFilters));
    return {
      label: point.label,
      rowCount: rows.length,
      valueCr: round(rows.reduce((sum, row) => sum + Number(row[metricKey] || 0), 0), 2)
    };
  });

  const renderProvisioningChart = (points, context = null) => {
    const filteredPoints = getFilteredFinancialRiskPoints(points, context?.filters, context?.enabledFilters, "provisioningCr");
    const values = filteredPoints.map((point) => point.valueCr);
    const comparisonPoints = getTrendComparisonPoints(
      points,
      context,
      financialRiskFilterDefinitions,
      (sourcePoints, filters, enabledFilters) => getFilteredFinancialRiskPoints(sourcePoints, filters, enabledFilters, "provisioningCr")
    );
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => point.valueCr > 0))
      : filteredPoints.some((point) => point.valueCr > 0);
    if (usesTrendEcharts("trendProvisioningChart")) {
      setTrendEchart("trendProvisioningChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        valueFormatter: (value) => `Rs. ${Number(value || 0).toFixed(2)} Cr`,
        axisName: "Rs. Cr",
        series: comparisonPoints.length ? comparisonPoints.map(({ label, palette, points: groupPoints }) => ({
          name: `${label} · Provisioning`,
          type: "line",
          data: groupPoints.map((point) => point.valueCr),
          itemStyle: { color: palette.primary },
          lineStyle: { color: palette.primary, width: 3 }
        })) : [{
          name: "Provisioning",
          type: "line",
          data: values,
          areaStyle: { color: "rgba(124, 58, 237, 0.17)" },
          itemStyle: { color: "#7c3aed" },
          lineStyle: { color: "#7c3aed", width: 3 }
        }]
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendProvisioningChart", {
      type: "line",
      data: { labels: points.map((point) => point.label), datasets: [{ label: "Provisioning", data: values, borderColor: "#7c3aed", backgroundColor: "rgba(124, 58, 237, 0.17)", borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true }] },
      options: buildChartOptions({ interaction: { mode: "index", intersect: false }, scales: { y: { ticks: { callback: (value) => `Rs. ${value} Cr` } } } })
    });
    return { hasData, filteredPoints };
  };

  const renderWrittenOffChart = (points, context = null) => {
    const filteredPoints = getFilteredFinancialRiskPoints(points, context?.filters, context?.enabledFilters, "writtenOffCr");
    const values = filteredPoints.map((point) => point.valueCr);
    const comparisonPoints = getTrendComparisonPoints(
      points,
      context,
      financialRiskFilterDefinitions,
      (sourcePoints, filters, enabledFilters) => getFilteredFinancialRiskPoints(sourcePoints, filters, enabledFilters, "writtenOffCr")
    );
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => point.valueCr > 0))
      : filteredPoints.some((point) => point.valueCr > 0);
    if (usesTrendEcharts("trendWrittenOffChart")) {
      setTrendEchart("trendWrittenOffChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        valueFormatter: (value) => `Rs. ${Number(value || 0).toFixed(2)} Cr`,
        axisName: "Rs. Cr",
        bars: true,
        series: comparisonPoints.length ? comparisonPoints.map(({ label, palette, points: groupPoints }) => ({
          name: `${label} · Written Off`, type: "bar", data: groupPoints.map((point) => point.valueCr), barMaxWidth: 24, itemStyle: { color: palette.primary }
        })) : [{ name: "Written Off", type: "bar", data: values, itemStyle: { color: "#dc2626" } }]
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendWrittenOffChart", {
      type: "bar",
      data: { labels: points.map((point) => point.label), datasets: [{ label: "Written Off", data: values, borderColor: "#dc2626", backgroundColor: "rgba(220, 38, 38, 0.7)", borderWidth: 1, borderRadius: 4 }] },
      options: buildChartOptions({ scales: { y: { ticks: { callback: (value) => `Rs. ${value} Cr` } } } })
    });
    return { hasData, filteredPoints };
  };

  const planPortfolioRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => planPortfolioFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredPlanPortfolioPoints = (points, filters, enabledFilters = null) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => planPortfolioRowMatches(row, filters, null, enabledFilters));
    return {
      label: point.label,
      rowCount: rows.length,
      portfolioCr: round(rows.reduce((sum, row) => sum + Number(row.portfolioCr || 0), 0), 2),
      planCr: round(rows.reduce((sum, row) => sum + Number(row.planCr || 0), 0), 2)
    };
  });

  const renderPlanPortfolioChart = (points, context = null) => {
    if (!context) return { hasData: false, filteredPoints: [] };
    const filteredPoints = getFilteredPlanPortfolioPoints(points, context.filters, context.enabledFilters);
    const comparisonPoints = getTrendComparisonPoints(points, context, planPortfolioFilterDefinitions, getFilteredPlanPortfolioPoints);
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => point.rowCount > 0))
      : filteredPoints.some((point) => point.rowCount > 0);
    const showLines = filteredPoints.length > 1;
    const seriesVisibility = context.seriesVisibility || { portfolio: true, plan: true };
    if (usesTrendEcharts("trendPlanPortfolioChart")) {
      setTrendEchart("trendPlanPortfolioChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        valueFormatter: (value) => `Rs. ${Number(value || 0).toFixed(2)} Cr`,
        axisName: "Rs. Cr",
        series: comparisonPoints.length ? comparisonPoints.flatMap(({ label, palette, points: groupPoints }) => [
          ...(seriesVisibility.portfolio ? [{ name: `${label} · Portfolio`, type: "line", data: groupPoints.map((point) => point.portfolioCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 3.2, type: "solid" } }] : []),
          ...(seriesVisibility.plan ? [{ name: `${label} · Plan`, type: "line", data: groupPoints.map((point) => point.planCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 2.8, type: "dashed" } }] : [])
        ]) : [
          ...(seriesVisibility.portfolio ? [{ name: "Portfolio", type: "line", data: filteredPoints.map((point) => point.portfolioCr), areaStyle: { color: "rgba(37, 99, 235, 0.1)" }, itemStyle: { color: "#2563eb" }, lineStyle: { color: "#2563eb", width: 3.2 } }] : []),
          ...(seriesVisibility.plan ? [{ name: "Plan", type: "line", data: filteredPoints.map((point) => point.planCr), itemStyle: { color: "#7c3aed" }, lineStyle: { color: "#7c3aed", width: 3 } }] : [])
        ]
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendPlanPortfolioChart", {
      type: "line",
      data: {
        labels: filteredPoints.map((point) => point.label),
        datasets: [
          {
            label: "Portfolio",
            data: filteredPoints.map((point) => point.portfolioCr),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            borderWidth: 3.2,
            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.32,
            fill: showLines,
            showLine: showLines,
            hidden: !seriesVisibility.portfolio
          },
          {
            label: "Plan",
            data: filteredPoints.map((point) => point.planCr),
            borderColor: "#7c3aed",
            backgroundColor: "rgba(124, 58, 237, 0.08)",
            borderWidth: 3,
            pointBackgroundColor: "#7c3aed",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
            showLine: showLines,
            hidden: !seriesVisibility.plan
          }
        ]
      },
      options: buildChartOptions({
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#3b0a78",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 10,
            callbacks: {
              title: (items) => items?.[0]?.label || "Period",
              label: (tooltipContext) => `${tooltipContext.dataset.label}: ${formatCr(tooltipContext.parsed.y)}`
            }
          }
        },
        scales: { y: { ticks: { callback: (value) => `Rs. ${value} Cr` } } }
      })
    });
    return { hasData, filteredPoints };
  };

  const visitsRowMatches = (row, filters, ignoredKey = null, enabledFilters = null) => visitsAllFilterDefinitions.every(({ key }) => {
    if (key === ignoredKey) return true;
    if (enabledFilters && enabledFilters[key] === false) return true;
    const selected = filters?.[key];
    return !(selected instanceof Set) || selected.size === 0 || selected.has(row[key]);
  });

  const getFilteredVisitPoints = (points, filters, enabledFilters = null) => points.map((point) => {
    const rows = (point.collectionBreakdown || []).filter((row) => visitsRowMatches(row, filters, null, enabledFilters));
    const visitRows = rows.filter((row) => Number(row.monthlyVisits || 0) > 0);
    return {
      label: point.label,
      rowCount: rows.length,
      monthlyVisits: visitRows.reduce((sum, row) => sum + Number(row.monthlyVisits || 0), 0),
      uniqueCustomers: new Set(visitRows.map((row) => row.customerName)).size
    };
  });

  const renderVisitsChart = (points, context = null) => {
    if (!context) return { hasData: false, filteredPoints: [] };
    const filteredPoints = getFilteredVisitPoints(points, context.filters, context.enabledFilters);
    const comparisonPoints = getTrendComparisonPoints(points, context, visitsAllFilterDefinitions, getFilteredVisitPoints);
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => point.monthlyVisits > 0))
      : filteredPoints.some((point) => point.monthlyVisits > 0);
    const seriesVisibility = context.seriesVisibility || { visits: true, uniqueCustomers: true };
    if (usesTrendEcharts("trendVisitsChart")) {
      setTrendEchart("trendVisitsChart", trendEchartOption({
        labels: getTrendComparisonLabels(filteredPoints, context),
        axisName: "Visits",
        bars: true,
        stacked: true,
        tooltipFooter: (items) => {
          if (comparisonPoints.length) return "Each cohort stack equals total visits for that comparison group.";
          const point = filteredPoints[items?.[0]?.dataIndex] || {};
          return `Total visits: <b>${formatCount(point.monthlyVisits || 0)}</b>`;
        },
        series: comparisonPoints.length ? comparisonPoints.flatMap(({ label, palette, index, points: groupPoints }) => [
          ...(seriesVisibility.uniqueCustomers ? [{ name: `${label} · Unique visits`, type: "bar", stack: `visits-${index}`, data: groupPoints.map((point) => point.uniqueCustomers), barMaxWidth: 22, itemStyle: { color: palette.secondary } }] : []),
          ...(seriesVisibility.visits ? [{ name: `${label} · Repeat visits`, type: "bar", stack: `visits-${index}`, data: groupPoints.map((point) => Math.max(0, point.monthlyVisits - point.uniqueCustomers)), barMaxWidth: 22, itemStyle: { color: palette.primary } }] : [])
        ]) : [
          ...(seriesVisibility.uniqueCustomers ? [{ name: "Unique visits", type: "bar", data: filteredPoints.map((point) => point.uniqueCustomers), barMaxWidth: 32, itemStyle: { color: "#7c3aed" } }] : []),
          ...(seriesVisibility.visits ? [{ name: "Repeat visits", type: "bar", data: filteredPoints.map((point) => Math.max(0, point.monthlyVisits - point.uniqueCustomers)), barMaxWidth: 32, itemStyle: { color: "#0f9f8f" } }] : [])
        ]
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }
    setChart("trendVisitsChart", {
      type: "bar",
      data: {
        labels: filteredPoints.map((point) => point.label),
        datasets: [
          {
            label: "Repeat visits",
            data: filteredPoints.map((point) => Math.max(0, point.monthlyVisits - point.uniqueCustomers)),
            borderColor: "#0f9f8f",
            backgroundColor: "rgba(15, 159, 143, 0.72)",
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 34,
            stack: "visits",
            hidden: !seriesVisibility.visits
          },
          {
            label: "Unique visits",
            data: filteredPoints.map((point) => point.uniqueCustomers),
            borderColor: "#7c3aed",
            backgroundColor: "rgba(124, 58, 237, 0.66)",
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 34,
            stack: "visits",
            hidden: !seriesVisibility.uniqueCustomers
          }
        ]
      },
      options: buildChartOptions({
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#3b0a78",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 10,
            callbacks: {
              title: (items) => items?.[0]?.label || "Period",
              afterBody: (items) => {
                const index = items?.[0]?.dataIndex;
                const point = filteredPoints[index] || {};
                return `Total visits: ${formatCount(point.monthlyVisits || 0)}`;
              }
            }
          }
        },
        scales: { x: { stacked: true }, y: { stacked: true } }
      })
    });
    return { hasData, filteredPoints };
  };

  const renderCollectionChart = (points, context = null) => {
    if (!context) {
      setChart("trendCollectionChart", {
        type: "line",
        data: {
          labels: points.map((point) => point.label),
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
          scales: { y: { ticks: { callback: (value) => `Rs. ${value} Cr` } } }
        })
      });
      return { hasData: points.length > 0, filteredPoints: [] };
    }

    const filteredPoints = getFilteredCollectionPoints(points, context.filters, context.enabledFilters);
    const comparisonPoints = getTrendComparisonPoints(points, context, collectionFilterDefinitions, getFilteredCollectionPoints);
    const hasData = comparisonPoints.length
      ? comparisonPoints.some((item) => item.points.some((point) => point.rowCount > 0))
      : filteredPoints.some((point) => point.rowCount > 0);
    const labels = getTrendComparisonLabels(filteredPoints, context);
    const showLines = filteredPoints.length > 1;
    const seriesVisibility = context.seriesVisibility || { collection: true, billing: true, target: true };

    if (usesTrendEcharts("trendCollectionChart")) {
      setTrendEchart("trendCollectionChart", trendEchartOption({
        labels,
        valueFormatter: (value) => `Rs. ${Number(value || 0).toFixed(2)} Cr`,
        axisName: "Rs. Cr",
        series: comparisonPoints.length ? comparisonPoints.flatMap(({ label, palette, points: groupPoints }) => [
          ...(seriesVisibility.collection ? [{ name: `${label} · Collection`, type: "line", symbol: "circle", data: groupPoints.map((point) => point.collectionCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 3.4, type: "solid" } }] : []),
          ...(seriesVisibility.billing ? [{ name: `${label} · New Billing`, type: "line", symbol: "rect", data: groupPoints.map((point) => point.newBillingCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 3, type: "dashed" } }] : []),
          ...(seriesVisibility.target ? [{ name: `${label} · PTP Target`, type: "line", symbol: "diamond", data: groupPoints.map((point) => point.ptpTargetCr), itemStyle: { color: palette.primary }, lineStyle: { color: palette.primary, width: 2.6, type: "dotted" } }] : [])
        ]) : [
          ...(seriesVisibility.collection ? [{ name: "Collection", type: "line", symbol: "circle", data: filteredPoints.map((point) => point.collectionCr), areaStyle: { color: "rgba(37, 99, 235, 0.14)" }, itemStyle: { color: "#2563eb" }, lineStyle: { color: "#2563eb", width: 3.4 } }] : []),
          ...(seriesVisibility.billing ? [{ name: "New Billing", type: "line", symbol: "rect", data: filteredPoints.map((point) => point.newBillingCr), itemStyle: { color: "#0f9f8f" }, lineStyle: { color: "#0f9f8f", width: 3.2 } }] : []),
          ...(seriesVisibility.target ? [{ name: "PTP Target", type: "line", symbol: "diamond", data: filteredPoints.map((point) => point.ptpTargetCr), itemStyle: { color: "#d97706" }, lineStyle: { color: "#d97706", width: 3 } }] : [])
        ]
      }));
      return { hasData, filteredPoints, comparisonPoints };
    }

    setChart("trendCollectionChart", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Collection",
            data: filteredPoints.map((point) => point.collectionCr),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            borderWidth: 3.2,
            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.32,
            fill: showLines,
            showLine: showLines,
            hidden: !seriesVisibility.collection
          },
          {
            label: "New Billing",
            data: filteredPoints.map((point) => point.newBillingCr),
            borderColor: "#0f9f8f",
            backgroundColor: "rgba(15, 159, 143, 0.08)",
            borderWidth: 3,
            pointBackgroundColor: "#0f9f8f",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.32,
            fill: false,
            showLine: showLines,
            hidden: !seriesVisibility.billing
          },
          {
            label: "PTP Target",
            data: filteredPoints.map((point) => point.ptpTargetCr),
            borderColor: "#d97706",
            backgroundColor: "#f59e0b",
            borderWidth: 3,
            pointBackgroundColor: "#f59e0b",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            tension: 0.28,
            showLine: showLines,
            fill: false,
            hidden: !seriesVisibility.target
          }
        ]
      },
      options: buildChartOptions({
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#3b0a78",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 10,
            callbacks: {
              title: (items) => items?.[0]?.label || "Period",
              label: (tooltipContext) => `${tooltipContext.dataset.label}: ${formatCr(tooltipContext.parsed.y)}`
            }
          }
        },
        scales: {
          y: { ticks: { callback: (value) => `Rs. ${value} Cr` } }
        }
      })
    });

    return { hasData, filteredPoints };
  };

  const renderCharts = (points, closingStatus, collectionContext = null, invoiceSubmissionContext = null, agingBucketsContext = null, cnAdvContext = null, provisioningContext = null, writtenOffContext = null) => {
    const labels = points.map((point) => point.label);
    const totals = getPointTotals(points);
    renderInsightCards(points);
    setText("trendVisitTotal", formatCount(totals.visits));
    setText("trendBillingTotal", formatCr(totals.billingCr));
    const collectionResult = renderCollectionChart(points, collectionContext);
    const invoiceSubmissionResult = renderInvoiceSubmissionChart(points, invoiceSubmissionContext);
    const agingBucketsResult = renderAgingBucketsChart(points, agingBucketsContext);
    const cnAdvResult = renderCnAdvChart(points, cnAdvContext);
    const provisioningResult = renderProvisioningChart(points, provisioningContext);
    const writtenOffResult = renderWrittenOffChart(points, writtenOffContext);

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
          { label: "0-30", data: points.map((point) => getAgingShare(point, "0-30")), borderColor: "#2563eb", backgroundColor: "rgba(37, 99, 235, 0.78)", borderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6, pointHoverBorderWidth: 2, tension: 0.35, fill: true, stack: "aging" },
          { label: "31-60", data: points.map((point) => getAgingShare(point, "31-60")), borderColor: "#16a34a", backgroundColor: "rgba(22, 163, 74, 0.68)", borderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6, pointHoverBorderWidth: 2, tension: 0.35, fill: true, stack: "aging" },
          { label: "61-90", data: points.map((point) => getAgingShare(point, "61-90")), borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.72)", borderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6, pointHoverBorderWidth: 2, tension: 0.35, fill: true, stack: "aging" },
          { label: "90+", data: points.map((point) => getAgingShare(point, "90+")), borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.72)", borderWidth: 1.5, pointRadius: 3, pointHoverRadius: 6, pointHoverBorderWidth: 2, tension: 0.35, fill: true, stack: "aging" }
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

    const lastPoint = points[points.length - 1] || { teamPerformance: [] };
    const agentNames = lastPoint.teamPerformance.slice(0, 8).map((row) => row.name);
    const committedAgentValues = agentNames.map((name) => lastPoint.teamPerformance.find((row) => row.name === name)?.committedCr || 0);
    const collectedAgentValues = agentNames.map((name) => lastPoint.teamPerformance.find((row) => row.name === name)?.collectedCr || 0);
    const maxAgentValue = Math.max(...committedAgentValues, ...collectedAgentValues, 0);
    const agentScaleMax = maxAgentValue > 0 ? maxAgentValue * 1.15 : 1;
    setChart("trendAgentCollectionChart", {
      type: "bar",
      data: {
        labels: agentNames,
        datasets: [
          {
            label: "Committed",
            data: committedAgentValues,
            backgroundColor: "rgba(186, 154, 224, 0.72)",
            borderColor: "rgba(186, 154, 224, 0.92)",
            borderWidth: 1,
            borderRadius: { topLeft: 18, topRight: 18 },
            barPercentage: 0.72,
            categoryPercentage: 0.58
          },
          {
            label: "Collected",
            data: collectedAgentValues,
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
            max: agentScaleMax,
            ticks: { callback: (value) => `Rs. ${value} Cr` }
          }
        }
      })
    });
    renderStatusPies(closingStatus);
    return { collectionResult, invoiceSubmissionResult, agingBucketsResult, cnAdvResult, provisioningResult, writtenOffResult };
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
    const multiPeriodGroup = $("trendMultiPeriodGroup");
    const multiPeriodLabel = $("trendMultiPeriodLabel");
    const multiPeriodSummary = $("trendMultiPeriodSummary");
    const multiPeriodMenu = $("trendMultiPeriodMenu");
    const collectionFilterTray = $("trendCollectionFilterTray");
    const collectionFilterRoot = $("trendCollectionFilterRoot");
    const collectionFilterGrid = $("trendCollectionFilterGrid");
    const collectionFilterChips = $("trendCollectionFilterChips");
    const collectionNoData = $("trendCollectionNoData");
    const collectionNoDataClear = $("trendCollectionNoDataClear");
    const collectionScopeMeta = $("trendCollectionScopeMeta");
    const collectionSeriesButtons = Array.from(document.querySelectorAll("[data-trend-collection-series]"));
    const planPortfolioFilterTray = $("trendPlanPortfolioFilterTray");
    const planPortfolioFilterRoot = $("trendPlanPortfolioFilterRoot");
    const planPortfolioFilterGrid = $("trendPlanPortfolioFilterGrid");
    const planPortfolioFilterChips = $("trendPlanPortfolioFilterChips");
    const planPortfolioNoData = $("trendPlanPortfolioNoData");
    const planPortfolioNoDataClear = $("trendPlanPortfolioNoDataClear");
    const planPortfolioScopeMeta = $("trendPlanPortfolioScopeMeta");
    const planPortfolioSeriesButtons = Array.from(document.querySelectorAll("[data-trend-plan-series]"));
    const visitsFilterTray = $("trendVisitsFilterTray");
    const visitsFilterRoot = $("trendVisitsFilterRoot");
    const visitsFilterGrid = $("trendVisitsFilterGrid");
    const visitsFilterChips = $("trendVisitsFilterChips");
    const visitsNoData = $("trendVisitsNoData");
    const visitsNoDataClear = $("trendVisitsNoDataClear");
    const visitsScopeMeta = $("trendVisitsScopeMeta");
    const visitsCustomerPicker = $("trendVisitsCustomerPicker");
    const visitsCustomerSummary = $("trendVisitsCustomerSummary");
    const visitsCustomerSearch = $("trendVisitsCustomerSearch");
    const visitsCustomerOptions = $("trendVisitsCustomerOptions");
    const visitsSeriesButtons = Array.from(document.querySelectorAll("[data-trend-visits-series]"));
    const invoiceSubmissionFilterTray = $("trendInvoiceSubmissionFilterTray");
    const invoiceSubmissionFilterRoot = $("trendInvoiceSubmissionFilterRoot");
    const invoiceSubmissionFilterGrid = $("trendInvoiceSubmissionFilterGrid");
    const invoiceSubmissionFilterChips = $("trendInvoiceSubmissionFilterChips");
    const invoiceSubmissionNoData = $("trendInvoiceSubmissionNoData");
    const invoiceSubmissionNoDataClear = $("trendInvoiceSubmissionNoDataClear");
    const invoiceSubmissionScopeMeta = $("trendInvoiceSubmissionScopeMeta");
    const agingBucketsFilterTray = $("trendAgingBucketsFilterTray");
    const agingBucketsFilterRoot = $("trendAgingBucketsFilterRoot");
    const agingBucketsFilterGrid = $("trendAgingBucketsFilterGrid");
    const agingBucketsFilterChips = $("trendAgingBucketsFilterChips");
    const agingBucketsNoData = $("trendAgingBucketsNoData");
    const agingBucketsNoDataClear = $("trendAgingBucketsNoDataClear");
    const agingBucketsScopeMeta = $("trendAgingBucketsScopeMeta");
    const cnAdvFilterTray = $("trendCnAdvFilterTray");
    const cnAdvFilterRoot = $("trendCnAdvFilterRoot");
    const cnAdvFilterGrid = $("trendCnAdvFilterGrid");
    const cnAdvFilterChips = $("trendCnAdvFilterChips");
    const cnAdvNoData = $("trendCnAdvNoData");
    const cnAdvNoDataClear = $("trendCnAdvNoDataClear");
    const cnAdvScopeMeta = $("trendCnAdvScopeMeta");
    const provisioningFilterTray = $("trendProvisioningFilterTray");
    const provisioningFilterRoot = $("trendProvisioningFilterRoot");
    const provisioningFilterGrid = $("trendProvisioningFilterGrid");
    const provisioningFilterChips = $("trendProvisioningFilterChips");
    const provisioningNoData = $("trendProvisioningNoData");
    const provisioningNoDataClear = $("trendProvisioningNoDataClear");
    const provisioningScopeMeta = $("trendProvisioningScopeMeta");
    const writtenOffFilterTray = $("trendWrittenOffFilterTray");
    const writtenOffFilterRoot = $("trendWrittenOffFilterRoot");
    const writtenOffFilterGrid = $("trendWrittenOffFilterGrid");
    const writtenOffFilterChips = $("trendWrittenOffFilterChips");
    const writtenOffNoData = $("trendWrittenOffNoData");
    const writtenOffNoDataClear = $("trendWrittenOffNoDataClear");
    const writtenOffScopeMeta = $("trendWrittenOffScopeMeta");
    const rangeButtons = Array.from(document.querySelectorAll("[data-trend-range]"));
    if (!toggleBtn || !trendView || !yearInput || !rangeSelect || !periodSelect) return;

    const nowGrid = trendView.previousElementSibling?.classList.contains("chartGrid")
      ? trendView.previousElementSibling
      : document.querySelector(".agentDashboard > .chartGrid");
    if (!nowGrid) return;
    const nowTopGrid = document.querySelector(".dashboardTopGrid");

    const minYear = Math.min(...trendHistoryData.monthKeys.map((key) => Number(key.slice(0, 4))));
    const maxYear = Math.max(...trendHistoryData.monthKeys.map((key) => Number(key.slice(0, 4))));
    const usesCollectionWorkspace = Boolean(
      collectionFilterTray && collectionFilterRoot && collectionFilterGrid && collectionFilterChips && collectionNoData
    );
    const usesPlanPortfolioWorkspace = Boolean(
      planPortfolioFilterTray && planPortfolioFilterRoot && planPortfolioFilterGrid && planPortfolioFilterChips && planPortfolioNoData
    );
    const usesVisitsWorkspace = Boolean(
      visitsFilterTray && visitsFilterRoot && visitsFilterGrid && visitsFilterChips && visitsNoData
        && visitsCustomerPicker && visitsCustomerSummary && visitsCustomerSearch && visitsCustomerOptions
    );
    const usesInvoiceSubmissionWorkspace = Boolean(
      invoiceSubmissionFilterTray && invoiceSubmissionFilterRoot && invoiceSubmissionFilterGrid
        && invoiceSubmissionFilterChips && invoiceSubmissionNoData
    );
    const usesAgingBucketsWorkspace = Boolean(
      agingBucketsFilterTray && agingBucketsFilterRoot && agingBucketsFilterGrid && agingBucketsFilterChips && agingBucketsNoData
    );
    const usesCnAdvWorkspace = Boolean(cnAdvFilterTray && cnAdvFilterRoot && cnAdvFilterGrid && cnAdvFilterChips && cnAdvNoData);
    const usesProvisioningWorkspace = Boolean(provisioningFilterTray && provisioningFilterRoot && provisioningFilterGrid && provisioningFilterChips && provisioningNoData);
    const usesWrittenOffWorkspace = Boolean(writtenOffFilterTray && writtenOffFilterRoot && writtenOffFilterGrid && writtenOffFilterChips && writtenOffNoData);
    const collectionAllRows = trendHistoryData.monthKeys.flatMap((key) => trendHistoryData.months[key]?.collectionBreakdown || []);
    const collectionCatalogs = Object.fromEntries(collectionFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const planPortfolioCatalogs = Object.fromEntries(planPortfolioFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const visitsCatalogs = Object.fromEntries(visitsAllFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const invoiceSubmissionCatalogs = Object.fromEntries(invoiceSubmissionFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const agingBucketsCatalogs = Object.fromEntries(agingBucketsFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const cnAdvCatalogs = Object.fromEntries(cnAdvFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const financialRiskCatalogs = Object.fromEntries(financialRiskFilterDefinitions.map(({ key }) => [
      key,
      [...new Set(collectionAllRows.map((row) => row[key]).filter(Boolean))]
        .sort((left, right) => String(left).localeCompare(String(right)))
    ]));
    const state = {
      activeYear: DEFAULT_YEAR,
      activeQuarter: CURRENT_QUARTER_KEY,
      activeMonth: CURRENT_MONTH_KEY,
      selectedPeriods: {
        yearly: [String(DEFAULT_YEAR)],
        fiscal_year: [String(DEFAULT_YEAR)],
        quarterly: [CURRENT_QUARTER_KEY],
        monthly: [CURRENT_MONTH_KEY]
      },
      globalPeriodComparison: { enabled: false, values: [] },
      currentGlobalPeriodComparison: null,
      collectionFilters: Object.fromEntries(collectionFilterDefinitions.map(({ key }) => [key, new Set()])),
      collectionFilterEnabled: Object.fromEntries(collectionFilterDefinitions.map(({ key }) => [key, true])),
      collectionSeriesVisibility: { collection: true, billing: true, target: true },
      collectionComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      planPortfolioFilters: Object.fromEntries(planPortfolioFilterDefinitions.map(({ key }) => [key, new Set()])),
      planPortfolioFilterEnabled: Object.fromEntries(planPortfolioFilterDefinitions.map(({ key }) => [key, true])),
      planPortfolioSeriesVisibility: { portfolio: true, plan: true },
      planPortfolioComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      visitsFilters: Object.fromEntries(visitsAllFilterDefinitions.map(({ key }) => [key, new Set()])),
      visitsFilterEnabled: Object.fromEntries(visitsAllFilterDefinitions.map(({ key }) => [key, true])),
      visitsSeriesVisibility: { visits: true, uniqueCustomers: true },
      visitsComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      invoiceSubmissionFilters: Object.fromEntries(invoiceSubmissionFilterDefinitions.map(({ key }) => [key, new Set()])),
      invoiceSubmissionFilterEnabled: Object.fromEntries(invoiceSubmissionFilterDefinitions.map(({ key }) => [key, true])),
      invoiceSubmissionComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      agingBucketsFilters: Object.fromEntries(agingBucketsFilterDefinitions.map(({ key }) => [key, new Set()])),
      agingBucketsFilterEnabled: Object.fromEntries(agingBucketsFilterDefinitions.map(({ key }) => [key, true])),
      agingBucketsComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      cnAdvFilters: Object.fromEntries(cnAdvFilterDefinitions.map(({ key }) => [key, new Set()])),
      cnAdvFilterEnabled: Object.fromEntries(cnAdvFilterDefinitions.map(({ key }) => [key, true])),
      cnAdvComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      provisioningFilters: Object.fromEntries(financialRiskFilterDefinitions.map(({ key }) => [key, new Set()])),
      provisioningFilterEnabled: Object.fromEntries(financialRiskFilterDefinitions.map(({ key }) => [key, true])),
      provisioningComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      writtenOffFilters: Object.fromEntries(financialRiskFilterDefinitions.map(({ key }) => [key, new Set()])),
      writtenOffFilterEnabled: Object.fromEntries(financialRiskFilterDefinitions.map(({ key }) => [key, true])),
      writtenOffComparison: { enabled: false, groups: [{ filters: {} }, { filters: {} }] },
      currentTrendPoints: [],
      range: "yearly",
      isTrendsVisible: false,
      hasRendered: false
    };
    const quarterOptions = getQuarterOptions();
    const monthOptions = getMonthOptions();
    const usesMultiPeriodSelect = Boolean(multiPeriodGroup && multiPeriodLabel && multiPeriodSummary && multiPeriodMenu);
    const globalPeriodCompareControl = document.createElement("div");
    globalPeriodCompareControl.className = "trendGlobalPeriodCompare";
    globalPeriodCompareControl.hidden = true;
    globalPeriodCompareControl.innerHTML = `
      <button type="button" class="trendGlobalCompareToggle" aria-pressed="false" aria-expanded="false">
        <i class="bi bi-bar-chart-line" aria-hidden="true"></i><span>Compare periods</span>
      </button>
      <div class="trendGlobalComparePickers" hidden>
        <label><span>Period A</span><select data-global-period-comparison="a" aria-label="Select first comparison period"></select></label>
        <label><span>Period B</span><select data-global-period-comparison="b" aria-label="Select second comparison period"></select></label>
      </div>`;
    if (usesMultiPeriodSelect) multiPeriodGroup.after(globalPeriodCompareControl);
    const globalPeriodCompareToggle = globalPeriodCompareControl.querySelector(".trendGlobalCompareToggle");
    const globalPeriodComparePickers = globalPeriodCompareControl.querySelector(".trendGlobalComparePickers");
    const globalPeriodCompareSelects = Array.from(globalPeriodCompareControl.querySelectorAll("select[data-global-period-comparison]"));
    const comparisonWorkspaces = {};
    const collectionFilterSearches = {};
    const planPortfolioFilterSearches = {};
    const visitsFilterSearches = {};
    const invoiceSubmissionFilterSearches = {};
    const agingBucketsFilterSearches = {};
    const cnAdvFilterSearches = {};
    const provisioningFilterSearches = {};
    const writtenOffFilterSearches = {};

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

    const getMultiPeriodOptions = () => {
      if (state.range === "yearly") return getAvailableYears().map((year) => ({ value: String(year), label: String(year) }));
      if (state.range === "fiscal_year") return getAvailableYears().map((year) => ({ value: String(year), label: fiscalYearDisplay(year) }));
      if (state.range === "quarterly") return quarterOptions;
      if (state.range === "monthly") return monthOptions;
      return [];
    };

    const getMultiPeriodLabel = () => ({
      yearly: "Year",
      fiscal_year: "Fiscal Year",
      quarterly: "Quarter",
      monthly: "Month"
    }[state.range] || "Period");

    const syncMultiPeriodSelect = () => {
      if (!usesMultiPeriodSelect) return;
      const options = getMultiPeriodOptions();
      const validValues = new Set(options.map((option) => option.value));
      const currentValues = (state.selectedPeriods[state.range] || []).filter((value) => validValues.has(value));
      const fallbackValue = options[options.length - 1]?.value || "";
      const selectedValues = currentValues.length ? currentValues : (fallbackValue ? [fallbackValue] : []);
      state.selectedPeriods[state.range] = selectedValues;
      multiPeriodLabel.textContent = getMultiPeriodLabel();
      const selectedOptions = options.filter((option) => selectedValues.includes(option.value));
      multiPeriodSummary.textContent = selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} ${getMultiPeriodLabel().toLowerCase()}${selectedOptions.length === 1 ? "" : "s"} selected`;
      multiPeriodMenu.replaceChildren();
      options.forEach((option) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "trendMultiPeriodOption";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = option.value;
        input.checked = selectedValues.includes(option.value);
        input.dataset.trendPeriodValue = option.value;
        const text = document.createElement("span");
        text.textContent = option.label;
        optionLabel.append(input, text);
        multiPeriodMenu.appendChild(optionLabel);
      });
    };

    const syncGlobalPeriodCompare = () => {
      const isAvailable = usesMultiPeriodSelect && state.range !== "all_time";
      globalPeriodCompareControl.hidden = !isAvailable;
      if (!isAvailable) {
        state.globalPeriodComparison.enabled = false;
        state.globalPeriodComparison.values = [];
        return;
      }

      const options = getMultiPeriodOptions();
      const validValues = new Set(options.map((option) => option.value));
      const values = [...new Set(state.globalPeriodComparison.values)].filter((value) => validValues.has(value));
      const selectedPeriods = (state.selectedPeriods[state.range] || []).filter((value) => validValues.has(value));
      const candidates = [...values, ...selectedPeriods, ...options.map((option) => option.value).reverse()]
        .filter((value, index, array) => array.indexOf(value) === index);
      state.globalPeriodComparison.values = candidates.slice(0, 2);

      const canCompare = options.length > 1;
      if (!canCompare) state.globalPeriodComparison.enabled = false;
      globalPeriodCompareToggle.disabled = !canCompare;
      globalPeriodCompareToggle.setAttribute("aria-pressed", state.globalPeriodComparison.enabled ? "true" : "false");
      globalPeriodCompareToggle.setAttribute("aria-expanded", state.globalPeriodComparison.enabled ? "true" : "false");
      globalPeriodCompareToggle.querySelector("span").textContent = state.globalPeriodComparison.enabled ? "Comparing periods" : "Compare periods";
      globalPeriodComparePickers.hidden = !state.globalPeriodComparison.enabled;

      if (!state.globalPeriodComparison.enabled) return;
      const [firstValue, secondValue] = state.globalPeriodComparison.values;
      globalPeriodCompareSelects.forEach((select, index) => {
        select.replaceChildren(...options.map((option) => {
          const node = document.createElement("option");
          node.value = option.value;
          node.textContent = option.label;
          node.disabled = option.value === (index === 0 ? secondValue : firstValue);
          return node;
        }));
        select.value = index === 0 ? firstValue : secondValue;
      });
    };

    const getGlobalPeriodComparisonGroups = () => {
      if (!state.globalPeriodComparison.enabled || state.range === "all_time") return null;
      const labels = new Map(getMultiPeriodOptions().map((option) => [option.value, option.label]));
      const values = [...new Set(state.globalPeriodComparison.values)].filter((value) => labels.has(value));
      if (values.length !== 2) return null;
      return values.map((value) => ({
        value,
        label: labels.get(value),
        points: getPeriodData(state.range, state.activeYear, getActivePeriodKey(), [value]).points
      }));
    };

    const syncTrendControls = () => {
      rangeSelect.value = state.range;
      syncRangeButtons();

      if (usesMultiPeriodSelect) {
        if (yearGroup) yearGroup.hidden = true;
        if (periodGroup) periodGroup.hidden = true;
        multiPeriodGroup.hidden = state.range === "all_time";
        if (!multiPeriodGroup.hidden) syncMultiPeriodSelect();
        syncGlobalPeriodCompare();
        return;
      }

      syncGlobalPeriodCompare();

      const usesYearInput = state.range === "yearly" || state.range === "fiscal_year";
      if (yearGroup) yearGroup.hidden = !usesYearInput;
      if (periodGroup) periodGroup.hidden = !(state.range === "quarterly" || state.range === "monthly");
      if (yearLabel) yearLabel.textContent = "Period";
      yearInput.setAttribute("aria-label", state.range === "fiscal_year" ? "Select fiscal year" : "Select trend year");

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

    const getCurrentCollectionRows = () => state.currentTrendPoints
      .flatMap((point) => point.collectionBreakdown || []);

    const isCollectionFilterInactive = (key) => {
      const selected = state.collectionFilters[key];
      return !(selected instanceof Set) || selected.size === 0;
    };

    const getCollectionAvailableValues = (key) => new Set(
      getCurrentCollectionRows()
        .filter((row) => collectionRowMatches(row, state.collectionFilters, key, state.collectionFilterEnabled))
        .map((row) => row[key])
        .filter(Boolean)
    );

    const getCollectionFilterSummary = (key) => {
      const selected = state.collectionFilters[key] || new Set();
      if (!selected.size) return "Nothing selected";
      if (selected.size === (collectionCatalogs[key] || []).length) return "All selected";
      const values = [...selected];
      return values.length === 1 ? values[0] : `${values.length} selected`;
    };

    const getCollectionFilterDisplay = (key) => {
      const selected = [...(state.collectionFilters[key] || new Set())];
      if (!selected.length) return "Nothing selected";
      if (selected.length === (collectionCatalogs[key] || []).length) return "All selected";
      if (selected.length <= 2) return selected.join(", ");
      return `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
    };

    const getCollectionContext = () => ({
      filters: state.collectionFilters,
      enabledFilters: state.collectionFilterEnabled,
      seriesVisibility: state.collectionSeriesVisibility,
      comparison: comparisonWorkspaces.collection?.getComparison() || state.collectionComparison,
      periodComparison: state.currentGlobalPeriodComparison
    });

    const closeCollectionFilterMenus = (except = null) => {
      if (!collectionFilterGrid) return;
      collectionFilterGrid.querySelectorAll("details[open]").forEach((details) => {
        if (details !== except) details.open = false;
      });
      if (!except && collectionFilterRoot) collectionFilterRoot.open = false;
    };

    const syncCollectionFilterChips = () => {
      if (!usesCollectionWorkspace) return;
      const activeDefinitions = collectionFilterDefinitions.filter(({ key }) => !isCollectionFilterInactive(key));
      collectionFilterChips.hidden = !activeDefinitions.length;
      collectionFilterChips.innerHTML = activeDefinitions.map(({ key, label }) => `
        <div class="trendCollectionAppliedFilter${state.collectionFilterEnabled[key] ? "" : " is-disabled"}">
          <button type="button" class="trendCollectionFilterVisibility" data-collection-filter-toggle="${escapeHtml(key)}" aria-pressed="${state.collectionFilterEnabled[key] ? "true" : "false"}" aria-label="${state.collectionFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter" title="${state.collectionFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter">
            <i class="bi ${state.collectionFilterEnabled[key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i>
          </button>
          <button type="button" class="trendCollectionAppliedFilterBody" data-collection-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(label)} filter">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(getCollectionFilterDisplay(key))}</strong>
          </button>
          <button type="button" class="trendCollectionFilterRemove" data-collection-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter">
            <i class="bi bi-x" aria-hidden="true"></i>
          </button>
        </div>
      `).join("") + (activeDefinitions.length ? `
        <button type="button" class="trendCollectionClearAll" data-collection-filter-reset="all">Clear all</button>
      ` : "");
    };

    const syncCollectionFilterGrid = (openKey = null) => {
      if (!usesCollectionWorkspace) return;
      const rootWasOpen = collectionFilterRoot.open;
      collectionFilterGrid.innerHTML = collectionFilterDefinitions.map(({ key, label }) => {
        const catalog = collectionCatalogs[key] || [];
        const selected = state.collectionFilters[key] || new Set();
        const available = getCollectionAvailableValues(key);
        const searchValue = String(collectionFilterSearches[key] || "");
        const normalizedSearch = searchValue.trim().toLowerCase();
        const visibleOptions = catalog.filter((value) => !normalizedSearch || String(value).toLowerCase().includes(normalizedSearch));
        const showSearch = catalog.length > 8;
        return `
          <details class="trendCollectionFilterSelect" data-collection-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
            <summary aria-label="Select ${escapeHtml(label)} filter values">
              <span class="trendCollectionFilterSummaryText">
                <span class="trendCollectionFilterLabel">${escapeHtml(label)}</span>
                <span class="trendCollectionFilterValue">${escapeHtml(getCollectionFilterSummary(key))}</span>
              </span>
              <i class="bi bi-chevron-right" aria-hidden="true"></i>
            </summary>
            <div class="trendCollectionFilterMenu">
              ${showSearch ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} options" />` : ""}
              <div class="trendCollectionFilterActions">
                <button type="button" data-collection-filter-action="all">Select all</button>
                <button type="button" data-collection-filter-action="clear">Clear</button>
              </div>
              <div class="trendCollectionFilterOptions">
                ${visibleOptions.map((value) => {
                  const isSelected = selected.has(value);
                  const isUnavailable = !available.has(value);
                  const isDisabled = isUnavailable && !isSelected;
                  return `
                    <label class="trendCollectionFilterOption${isUnavailable ? " is-unavailable" : ""}">
                      <input type="checkbox" value="${escapeHtml(value)}" data-collection-filter-value="${escapeHtml(value)}"${isSelected ? " checked" : ""}${isDisabled ? " disabled" : ""} />
                      <span>${escapeHtml(value)}</span>
                    </label>
                  `;
                }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}
              </div>
            </div>
          </details>
        `;
      }).join("");
      collectionFilterRoot.open = rootWasOpen || Boolean(openKey);

      collectionFilterGrid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => {
        details.addEventListener("toggle", () => {
          if (details.open) closeCollectionFilterMenus(details);
        });
      });
    };

    const syncCollectionHeaderControls = () => {
      if (!usesCollectionWorkspace) return;
      collectionSeriesButtons.forEach((button) => {
        const key = button.dataset.trendCollectionSeries;
        button.setAttribute("aria-pressed", state.collectionSeriesVisibility[key] ? "true" : "false");
      });
    };

    const syncCollectionResultState = (result) => {
      if (!usesCollectionWorkspace) return;
      const hasData = Boolean(result?.hasData);
      collectionNoData.hidden = hasData;
      const canvas = $("trendCollectionChart");
      if (canvas) {
        canvas.style.opacity = hasData ? "1" : "0.12";
        canvas.style.pointerEvents = hasData ? "auto" : "none";
      }
      const configuredDefinitions = collectionFilterDefinitions.filter(({ key }) => !isCollectionFilterInactive(key));
      const activeFilterCount = configuredDefinitions.filter(({ key }) => state.collectionFilterEnabled[key]).length;
      const disabledFilterCount = configuredDefinitions.length - activeFilterCount;
      if (collectionScopeMeta) {
        if (!activeFilterCount && !disabledFilterCount) {
          collectionScopeMeta.textContent = "Collection, new billing, and committed PTP across the selected period";
        } else {
          const matchingRows = getCurrentCollectionRows().filter((row) => collectionRowMatches(row, state.collectionFilters, null, state.collectionFilterEnabled));
          const customerCount = new Set(matchingRows.map((row) => row.customerName)).size;
          const pausedText = disabledFilterCount ? ` | ${disabledFilterCount} paused` : "";
          collectionScopeMeta.textContent = `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied${pausedText} | ${customerCount} customer${customerCount === 1 ? "" : "s"}`;
        }
      }
    };

    const syncCollectionWorkspace = (openKey = null, rerenderChart = true) => {
      if (!usesCollectionWorkspace) return;
      syncCollectionFilterGrid(openKey);
      syncCollectionFilterChips();
      syncCollectionHeaderControls();
      comparisonWorkspaces.collection?.sync();
      if (rerenderChart) {
        syncCollectionResultState(renderCollectionChart(state.currentTrendPoints, getCollectionContext()));
      }
    };

    const resetCollectionFilters = (key = "all") => {
      collectionFilterDefinitions.forEach((definition) => {
        if (key !== "all" && definition.key !== key) return;
        state.collectionFilters[definition.key] = new Set();
        state.collectionFilterEnabled[definition.key] = true;
        collectionFilterSearches[definition.key] = "";
      });
      syncCollectionWorkspace();
    };

    const getCurrentPlanPortfolioRows = () => state.currentTrendPoints
      .flatMap((point) => point.collectionBreakdown || []);

    const isPlanPortfolioFilterInactive = (key) => {
      const selected = state.planPortfolioFilters[key];
      return !(selected instanceof Set) || selected.size === 0;
    };

    const getPlanPortfolioAvailableValues = (key) => new Set(
      getCurrentPlanPortfolioRows()
        .filter((row) => planPortfolioRowMatches(row, state.planPortfolioFilters, key, state.planPortfolioFilterEnabled))
        .map((row) => row[key])
        .filter(Boolean)
    );

    const getPlanPortfolioFilterSummary = (key) => {
      const selected = state.planPortfolioFilters[key] || new Set();
      if (!selected.size) return "Nothing selected";
      if (selected.size === (planPortfolioCatalogs[key] || []).length) return "All selected";
      const values = [...selected];
      return values.length === 1 ? values[0] : `${values.length} selected`;
    };

    const getPlanPortfolioFilterDisplay = (key) => {
      const selected = [...(state.planPortfolioFilters[key] || new Set())];
      if (!selected.length) return "Nothing selected";
      if (selected.length === (planPortfolioCatalogs[key] || []).length) return "All selected";
      return selected.length <= 2 ? selected.join(", ") : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
    };

    const getPlanPortfolioContext = () => ({
      filters: state.planPortfolioFilters,
      enabledFilters: state.planPortfolioFilterEnabled,
      seriesVisibility: state.planPortfolioSeriesVisibility,
      comparison: comparisonWorkspaces.planPortfolio?.getComparison() || state.planPortfolioComparison,
      periodComparison: state.currentGlobalPeriodComparison
    });

    const closePlanPortfolioFilterMenus = (except = null) => {
      if (!planPortfolioFilterGrid) return;
      planPortfolioFilterGrid.querySelectorAll("details[open]").forEach((details) => {
        if (details !== except) details.open = false;
      });
      if (!except && planPortfolioFilterRoot) planPortfolioFilterRoot.open = false;
    };

    const syncPlanPortfolioFilterChips = () => {
      if (!usesPlanPortfolioWorkspace) return;
      const activeDefinitions = planPortfolioFilterDefinitions.filter(({ key }) => !isPlanPortfolioFilterInactive(key));
      planPortfolioFilterChips.hidden = !activeDefinitions.length;
      planPortfolioFilterChips.innerHTML = activeDefinitions.map(({ key, label }) => `
        <div class="trendCollectionAppliedFilter${state.planPortfolioFilterEnabled[key] ? "" : " is-disabled"}">
          <button type="button" class="trendCollectionFilterVisibility" data-plan-filter-toggle="${escapeHtml(key)}" aria-pressed="${state.planPortfolioFilterEnabled[key] ? "true" : "false"}" aria-label="${state.planPortfolioFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter" title="${state.planPortfolioFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter">
            <i class="bi ${state.planPortfolioFilterEnabled[key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i>
          </button>
          <button type="button" class="trendCollectionAppliedFilterBody" data-plan-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(label)} filter">
            <span>${escapeHtml(label)}</span><strong>${escapeHtml(getPlanPortfolioFilterDisplay(key))}</strong>
          </button>
          <button type="button" class="trendCollectionFilterRemove" data-plan-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
        </div>
      `).join("") + (activeDefinitions.length ? `<button type="button" class="trendCollectionClearAll" data-plan-filter-reset="all">Clear all</button>` : "");
    };

    const syncPlanPortfolioFilterGrid = (openKey = null) => {
      if (!usesPlanPortfolioWorkspace) return;
      const rootWasOpen = planPortfolioFilterRoot.open;
      planPortfolioFilterGrid.innerHTML = planPortfolioFilterDefinitions.map(({ key, label }) => {
        const catalog = planPortfolioCatalogs[key] || [];
        const selected = state.planPortfolioFilters[key] || new Set();
        const available = getPlanPortfolioAvailableValues(key);
        const searchValue = String(planPortfolioFilterSearches[key] || "");
        const normalizedSearch = searchValue.trim().toLowerCase();
        const visibleOptions = catalog.filter((value) => !normalizedSearch || String(value).toLowerCase().includes(normalizedSearch));
        return `
          <details class="trendCollectionFilterSelect" data-plan-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
            <summary aria-label="Select ${escapeHtml(label)} filter values"><span class="trendCollectionFilterSummaryText"><span class="trendCollectionFilterLabel">${escapeHtml(label)}</span><span class="trendCollectionFilterValue">${escapeHtml(getPlanPortfolioFilterSummary(key))}</span></span><i class="bi bi-chevron-right" aria-hidden="true"></i></summary>
            <div class="trendCollectionFilterMenu">
              ${catalog.length > 8 ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} options" />` : ""}
              <div class="trendCollectionFilterActions"><button type="button" data-plan-filter-action="all">Select all</button><button type="button" data-plan-filter-action="clear">Clear</button></div>
              <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => {
                const isSelected = selected.has(value);
                const isUnavailable = !available.has(value);
                return `<label class="trendCollectionFilterOption${isUnavailable ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-plan-filter-value="${escapeHtml(value)}"${isSelected ? " checked" : ""}${isUnavailable && !isSelected ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`;
              }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div>
            </div>
          </details>`;
      }).join("");
      planPortfolioFilterRoot.open = rootWasOpen || Boolean(openKey);
      planPortfolioFilterGrid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => {
        details.addEventListener("toggle", () => { if (details.open) closePlanPortfolioFilterMenus(details); });
      });
    };

    const syncPlanPortfolioResultState = (result) => {
      if (!usesPlanPortfolioWorkspace) return;
      const hasData = Boolean(result?.hasData);
      planPortfolioNoData.hidden = hasData;
      const canvas = $("trendPlanPortfolioChart");
      if (canvas) {
        canvas.style.opacity = hasData ? "1" : "0.12";
        canvas.style.pointerEvents = hasData ? "auto" : "none";
      }
      const configured = planPortfolioFilterDefinitions.filter(({ key }) => !isPlanPortfolioFilterInactive(key));
      const activeCount = configured.filter(({ key }) => state.planPortfolioFilterEnabled[key]).length;
      const pausedCount = configured.length - activeCount;
      if (!planPortfolioScopeMeta) return;
      if (!activeCount && !pausedCount) {
        planPortfolioScopeMeta.textContent = "Monthly plan submitted weekly, excluding PTP, against the selected portfolio";
        return;
      }
      const matchingRows = getCurrentPlanPortfolioRows().filter((row) => planPortfolioRowMatches(row, state.planPortfolioFilters, null, state.planPortfolioFilterEnabled));
      const customers = new Set(matchingRows.map((row) => row.customerName)).size;
      planPortfolioScopeMeta.textContent = `${activeCount} filter${activeCount === 1 ? "" : "s"} applied${pausedCount ? ` | ${pausedCount} paused` : ""} | ${customers} customer${customers === 1 ? "" : "s"}`;
    };

    const syncPlanPortfolioHeaderControls = () => {
      planPortfolioSeriesButtons.forEach((button) => {
        const key = button.dataset.trendPlanSeries;
        button.setAttribute("aria-pressed", state.planPortfolioSeriesVisibility[key] ? "true" : "false");
      });
    };

    const syncPlanPortfolioWorkspace = (openKey = null, rerenderChart = true) => {
      if (!usesPlanPortfolioWorkspace) return;
      syncPlanPortfolioFilterGrid(openKey);
      syncPlanPortfolioFilterChips();
      syncPlanPortfolioHeaderControls();
      comparisonWorkspaces.planPortfolio?.sync();
      if (rerenderChart) syncPlanPortfolioResultState(renderPlanPortfolioChart(state.currentTrendPoints, getPlanPortfolioContext()));
    };

    const resetPlanPortfolioFilters = (key = "all") => {
      planPortfolioFilterDefinitions.forEach((definition) => {
        if (key !== "all" && definition.key !== key) return;
        state.planPortfolioFilters[definition.key] = new Set();
        state.planPortfolioFilterEnabled[definition.key] = true;
        planPortfolioFilterSearches[definition.key] = "";
      });
      syncPlanPortfolioWorkspace();
    };

    const getCurrentVisitsRows = () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []);
    const isVisitsFilterInactive = (key) => !(state.visitsFilters[key] instanceof Set) || !state.visitsFilters[key].size;
    const getVisitsAvailableValues = (key) => new Set(getCurrentVisitsRows()
      .filter((row) => visitsRowMatches(row, state.visitsFilters, key, state.visitsFilterEnabled))
      .map((row) => row[key]).filter(Boolean));
    const getVisitsFilterSummary = (key) => {
      const selected = state.visitsFilters[key] || new Set();
      if (!selected.size) return "Nothing selected";
      if (selected.size === (visitsCatalogs[key] || []).length) return "All selected";
      const values = [...selected];
      return values.length === 1 ? values[0] : `${values.length} selected`;
    };
    const getVisitsFilterDisplay = (key) => {
      const selected = [...(state.visitsFilters[key] || new Set())];
      if (!selected.length) return "Nothing selected";
      if (selected.length === (visitsCatalogs[key] || []).length) return "All selected";
      return selected.length <= 2 ? selected.join(", ") : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
    };
    const getVisitsContext = () => ({
      filters: state.visitsFilters,
      enabledFilters: state.visitsFilterEnabled,
      seriesVisibility: state.visitsSeriesVisibility,
      comparison: comparisonWorkspaces.visits?.getComparison() || state.visitsComparison,
      periodComparison: state.currentGlobalPeriodComparison
    });
    const closeVisitsFilterMenus = (except = null) => {
      visitsFilterGrid?.querySelectorAll("details[open]").forEach((details) => { if (details !== except) details.open = false; });
      if (!except && visitsFilterRoot) visitsFilterRoot.open = false;
    };
    const getVisitCustomerOptions = () => {
      const matchingRows = getCurrentVisitsRows().filter((row) => visitsRowMatches(row, state.visitsFilters, "customerName", state.visitsFilterEnabled));
      return Object.values(matchingRows.reduce((acc, row) => {
        const name = row.customerName;
        if (!name) return acc;
        acc[name] = acc[name] || { name, visits: 0 };
        acc[name].visits += Number(row.monthlyVisits || 0);
        return acc;
      }, {})).sort((left, right) => right.visits - left.visits || left.name.localeCompare(right.name));
    };
    const syncVisitsCustomerPicker = () => {
      if (!usesVisitsWorkspace) return;
      const selected = state.visitsFilters.customerName || new Set();
      visitsCustomerSummary.textContent = !selected.size ? "Customer" : selected.size === 1 ? [...selected][0] : `${selected.size} customers`;
      const search = visitsCustomerSearch.value.trim().toLowerCase();
      const options = getVisitCustomerOptions().filter(({ name }) => !search || name.toLowerCase().includes(search));
      visitsCustomerOptions.innerHTML = options.map(({ name, visits }) => `
        <label class="trendVisitsCustomerOption">
          <input type="checkbox" value="${escapeHtml(name)}" data-visits-customer-value="${escapeHtml(name)}"${selected.has(name) ? " checked" : ""} />
          <strong>${escapeHtml(name)}</strong><span>${formatCount(visits)} visits</span>
        </label>`).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching customers</div>`;
    };
    const syncVisitsFilterChips = () => {
      if (!usesVisitsWorkspace) return;
      const activeDefinitions = visitsAllFilterDefinitions.filter(({ key }) => !isVisitsFilterInactive(key));
      visitsFilterChips.hidden = !activeDefinitions.length;
      visitsFilterChips.innerHTML = activeDefinitions.map(({ key, label }) => `
        <div class="trendCollectionAppliedFilter${state.visitsFilterEnabled[key] ? "" : " is-disabled"}">
          <button type="button" class="trendCollectionFilterVisibility" data-visits-filter-toggle="${escapeHtml(key)}" aria-pressed="${state.visitsFilterEnabled[key] ? "true" : "false"}" aria-label="${state.visitsFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter" title="${state.visitsFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter"><i class="bi ${state.visitsFilterEnabled[key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i></button>
          <button type="button" class="trendCollectionAppliedFilterBody" data-visits-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(label)} filter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(getVisitsFilterDisplay(key))}</strong></button>
          <button type="button" class="trendCollectionFilterRemove" data-visits-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
        </div>`).join("") + (activeDefinitions.length ? `<button type="button" class="trendCollectionClearAll" data-visits-filter-reset="all">Clear all</button>` : "");
    };
    const syncVisitsFilterGrid = (openKey = null) => {
      if (!usesVisitsWorkspace) return;
      const rootWasOpen = visitsFilterRoot.open;
      visitsFilterGrid.innerHTML = visitsFilterDefinitions.map(({ key, label }) => {
        const catalog = visitsCatalogs[key] || [];
        const selected = state.visitsFilters[key] || new Set();
        const available = getVisitsAvailableValues(key);
        const searchValue = String(visitsFilterSearches[key] || "");
        const visibleOptions = catalog.filter((value) => !searchValue.trim() || String(value).toLowerCase().includes(searchValue.trim().toLowerCase()));
        return `<details class="trendCollectionFilterSelect" data-visits-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
          <summary aria-label="Select ${escapeHtml(label)} filter values"><span class="trendCollectionFilterSummaryText"><span class="trendCollectionFilterLabel">${escapeHtml(label)}</span><span class="trendCollectionFilterValue">${escapeHtml(getVisitsFilterSummary(key))}</span></span><i class="bi bi-chevron-right" aria-hidden="true"></i></summary>
          <div class="trendCollectionFilterMenu">${catalog.length > 8 ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} options" />` : ""}
            <div class="trendCollectionFilterActions"><button type="button" data-visits-filter-action="all">Select all</button><button type="button" data-visits-filter-action="clear">Clear</button></div>
            <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => `<label class="trendCollectionFilterOption${!available.has(value) ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-visits-filter-value="${escapeHtml(value)}"${selected.has(value) ? " checked" : ""}${!available.has(value) && !selected.has(value) ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div>
          </div></details>`;
      }).join("");
      visitsFilterRoot.open = rootWasOpen || Boolean(openKey);
      visitsFilterGrid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => details.addEventListener("toggle", () => { if (details.open) closeVisitsFilterMenus(details); }));
    };
    const syncVisitsResultState = (result) => {
      if (!usesVisitsWorkspace) return;
      const hasData = Boolean(result?.hasData);
      visitsNoData.hidden = hasData;
      const canvas = $("trendVisitsChart");
      if (canvas) { canvas.style.opacity = hasData ? "1" : "0.12"; canvas.style.pointerEvents = hasData ? "auto" : "none"; }
      const configured = visitsAllFilterDefinitions.filter(({ key }) => !isVisitsFilterInactive(key));
      const activeCount = configured.filter(({ key }) => state.visitsFilterEnabled[key]).length;
      const pausedCount = configured.length - activeCount;
      if (!visitsScopeMeta) return;
      if (!activeCount && !pausedCount) { visitsScopeMeta.textContent = "Total visits shown as unique and repeat customer visits"; return; }
      const matchingRows = getCurrentVisitsRows().filter((row) => visitsRowMatches(row, state.visitsFilters, null, state.visitsFilterEnabled));
      const customers = new Set(matchingRows.filter((row) => row.monthlyVisits > 0).map((row) => row.customerName)).size;
      visitsScopeMeta.textContent = `${activeCount} filter${activeCount === 1 ? "" : "s"} applied${pausedCount ? ` | ${pausedCount} paused` : ""} | ${customers} customer${customers === 1 ? "" : "s"} visited`;
    };
    const syncVisitsHeaderControls = () => {
      visitsSeriesButtons.forEach((button) => {
        const key = button.dataset.trendVisitsSeries;
        button.setAttribute("aria-pressed", state.visitsSeriesVisibility[key] ? "true" : "false");
      });
    };
    const syncVisitsWorkspace = (openKey = null, rerenderChart = true) => {
      if (!usesVisitsWorkspace) return;
      syncVisitsFilterGrid(openKey);
      syncVisitsCustomerPicker();
      syncVisitsFilterChips();
      syncVisitsHeaderControls();
      comparisonWorkspaces.visits?.sync();
      if (rerenderChart) syncVisitsResultState(renderVisitsChart(state.currentTrendPoints, getVisitsContext()));
    };
    const resetVisitsFilters = (key = "all") => {
      visitsAllFilterDefinitions.forEach((definition) => {
        if (key !== "all" && definition.key !== key) return;
        state.visitsFilters[definition.key] = new Set();
        state.visitsFilterEnabled[definition.key] = true;
        visitsFilterSearches[definition.key] = "";
      });
      if (key === "all" || key === "customerName") visitsCustomerSearch.value = "";
      syncVisitsWorkspace();
    };

    const getCurrentInvoiceSubmissionRows = () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []);
    const isInvoiceSubmissionFilterInactive = (key) => !(state.invoiceSubmissionFilters[key] instanceof Set) || !state.invoiceSubmissionFilters[key].size;
    const getInvoiceSubmissionAvailableValues = (key) => new Set(getCurrentInvoiceSubmissionRows()
      .filter((row) => invoiceSubmissionRowMatches(row, state.invoiceSubmissionFilters, key, state.invoiceSubmissionFilterEnabled))
      .map((row) => row[key]).filter(Boolean));
    const getInvoiceSubmissionFilterSummary = (key) => {
      const selected = state.invoiceSubmissionFilters[key] || new Set();
      if (!selected.size) return "Nothing selected";
      if (selected.size === (invoiceSubmissionCatalogs[key] || []).length) return "All selected";
      const values = [...selected];
      return values.length === 1 ? values[0] : `${values.length} selected`;
    };
    const getInvoiceSubmissionFilterDisplay = (key) => {
      const selected = [...(state.invoiceSubmissionFilters[key] || new Set())];
      if (!selected.length) return "Nothing selected";
      if (selected.length === (invoiceSubmissionCatalogs[key] || []).length) return "All selected";
      return selected.length <= 2 ? selected.join(", ") : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
    };
    const getInvoiceSubmissionContext = () => ({
      filters: state.invoiceSubmissionFilters,
      enabledFilters: state.invoiceSubmissionFilterEnabled,
      comparison: comparisonWorkspaces.invoiceSubmission?.getComparison() || state.invoiceSubmissionComparison,
      periodComparison: state.currentGlobalPeriodComparison
    });
    const closeInvoiceSubmissionFilterMenus = (except = null) => {
      invoiceSubmissionFilterGrid?.querySelectorAll("details[open]").forEach((details) => { if (details !== except) details.open = false; });
      if (!except && invoiceSubmissionFilterRoot) invoiceSubmissionFilterRoot.open = false;
    };
    const syncInvoiceSubmissionFilterChips = () => {
      if (!usesInvoiceSubmissionWorkspace) return;
      const activeDefinitions = invoiceSubmissionFilterDefinitions.filter(({ key }) => !isInvoiceSubmissionFilterInactive(key));
      invoiceSubmissionFilterChips.hidden = !activeDefinitions.length;
      invoiceSubmissionFilterChips.innerHTML = activeDefinitions.map(({ key, label }) => `
        <div class="trendCollectionAppliedFilter${state.invoiceSubmissionFilterEnabled[key] ? "" : " is-disabled"}">
          <button type="button" class="trendCollectionFilterVisibility" data-invoice-submission-filter-toggle="${escapeHtml(key)}" aria-pressed="${state.invoiceSubmissionFilterEnabled[key] ? "true" : "false"}" aria-label="${state.invoiceSubmissionFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter" title="${state.invoiceSubmissionFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter"><i class="bi ${state.invoiceSubmissionFilterEnabled[key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i></button>
          <button type="button" class="trendCollectionAppliedFilterBody" data-invoice-submission-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(label)} filter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(getInvoiceSubmissionFilterDisplay(key))}</strong></button>
          <button type="button" class="trendCollectionFilterRemove" data-invoice-submission-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
        </div>`).join("") + (activeDefinitions.length ? `<button type="button" class="trendCollectionClearAll" data-invoice-submission-filter-reset="all">Clear all</button>` : "");
    };
    const syncInvoiceSubmissionFilterGrid = (openKey = null) => {
      if (!usesInvoiceSubmissionWorkspace) return;
      const rootWasOpen = invoiceSubmissionFilterRoot.open;
      invoiceSubmissionFilterGrid.innerHTML = invoiceSubmissionFilterDefinitions.map(({ key, label }) => {
        const catalog = invoiceSubmissionCatalogs[key] || [];
        const selected = state.invoiceSubmissionFilters[key] || new Set();
        const available = getInvoiceSubmissionAvailableValues(key);
        const searchValue = String(invoiceSubmissionFilterSearches[key] || "");
        const normalizedSearch = searchValue.trim().toLowerCase();
        const visibleOptions = catalog.filter((value) => !normalizedSearch || String(value).toLowerCase().includes(normalizedSearch));
        return `<details class="trendCollectionFilterSelect" data-invoice-submission-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
          <summary aria-label="Select ${escapeHtml(label)} filter values"><span class="trendCollectionFilterSummaryText"><span class="trendCollectionFilterLabel">${escapeHtml(label)}</span><span class="trendCollectionFilterValue">${escapeHtml(getInvoiceSubmissionFilterSummary(key))}</span></span><i class="bi bi-chevron-right" aria-hidden="true"></i></summary>
          <div class="trendCollectionFilterMenu">${catalog.length > 8 ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} options" />` : ""}
            <div class="trendCollectionFilterActions"><button type="button" data-invoice-submission-filter-action="all">Select all</button><button type="button" data-invoice-submission-filter-action="clear">Clear</button></div>
            <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => {
              const isSelected = selected.has(value);
              const isUnavailable = !available.has(value);
              return `<label class="trendCollectionFilterOption${isUnavailable ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-invoice-submission-filter-value="${escapeHtml(value)}"${isSelected ? " checked" : ""}${isUnavailable && !isSelected ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`;
            }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div>
          </div></details>`;
      }).join("");
      invoiceSubmissionFilterRoot.open = rootWasOpen || Boolean(openKey);
      invoiceSubmissionFilterGrid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => details.addEventListener("toggle", () => { if (details.open) closeInvoiceSubmissionFilterMenus(details); }));
    };
    const syncInvoiceSubmissionResultState = (result) => {
      if (!usesInvoiceSubmissionWorkspace) return;
      const hasData = Boolean(result?.hasData);
      invoiceSubmissionNoData.hidden = hasData;
      const canvas = $("trendInvoiceSubmissionChart");
      if (canvas) { canvas.style.opacity = hasData ? "1" : "0.12"; canvas.style.pointerEvents = hasData ? "auto" : "none"; }
      const configured = invoiceSubmissionFilterDefinitions.filter(({ key }) => !isInvoiceSubmissionFilterInactive(key));
      const activeCount = configured.filter(({ key }) => state.invoiceSubmissionFilterEnabled[key]).length;
      const pausedCount = configured.length - activeCount;
      if (!invoiceSubmissionScopeMeta) return;
      if (!activeCount && !pausedCount) { invoiceSubmissionScopeMeta.textContent = "Submission channel split across the selected period"; return; }
      const matchingRows = getCurrentInvoiceSubmissionRows().filter((row) => invoiceSubmissionRowMatches(row, state.invoiceSubmissionFilters, null, state.invoiceSubmissionFilterEnabled));
      const customers = new Set(matchingRows.map((row) => row.customerName)).size;
      invoiceSubmissionScopeMeta.textContent = `${activeCount} filter${activeCount === 1 ? "" : "s"} applied${pausedCount ? ` | ${pausedCount} paused` : ""} | ${customers} customer${customers === 1 ? "" : "s"}`;
    };
    const syncInvoiceSubmissionWorkspace = (openKey = null, rerenderChart = true) => {
      if (!usesInvoiceSubmissionWorkspace) return;
      syncInvoiceSubmissionFilterGrid(openKey);
      syncInvoiceSubmissionFilterChips();
      comparisonWorkspaces.invoiceSubmission?.sync();
      if (rerenderChart) syncInvoiceSubmissionResultState(renderInvoiceSubmissionChart(state.currentTrendPoints, getInvoiceSubmissionContext()));
    };
    const resetInvoiceSubmissionFilters = (key = "all") => {
      invoiceSubmissionFilterDefinitions.forEach((definition) => {
        if (key !== "all" && definition.key !== key) return;
        state.invoiceSubmissionFilters[definition.key] = new Set();
        state.invoiceSubmissionFilterEnabled[definition.key] = true;
        invoiceSubmissionFilterSearches[definition.key] = "";
      });
      syncInvoiceSubmissionWorkspace();
    };

    const getCurrentAgingBucketsRows = () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []);
    const isAgingBucketsFilterInactive = (key) => !(state.agingBucketsFilters[key] instanceof Set) || !state.agingBucketsFilters[key].size;
    const getAgingBucketsAvailableValues = (key) => new Set(getCurrentAgingBucketsRows()
      .filter((row) => agingBucketsRowMatches(row, state.agingBucketsFilters, key, state.agingBucketsFilterEnabled))
      .map((row) => row[key]).filter(Boolean));
    const getAgingBucketsFilterSummary = (key) => {
      const selected = state.agingBucketsFilters[key] || new Set();
      if (!selected.size) return "Nothing selected";
      if (selected.size === (agingBucketsCatalogs[key] || []).length) return "All selected";
      const values = [...selected];
      return values.length === 1 ? values[0] : `${values.length} selected`;
    };
    const getAgingBucketsFilterDisplay = (key) => {
      const selected = [...(state.agingBucketsFilters[key] || new Set())];
      if (!selected.length) return "Nothing selected";
      if (selected.length === (agingBucketsCatalogs[key] || []).length) return "All selected";
      return selected.length <= 2 ? selected.join(", ") : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
    };
    const getAgingBucketsContext = () => ({
      filters: state.agingBucketsFilters,
      enabledFilters: state.agingBucketsFilterEnabled,
      comparison: comparisonWorkspaces.agingBuckets?.getComparison() || state.agingBucketsComparison,
      periodComparison: state.currentGlobalPeriodComparison
    });
    const closeAgingBucketsFilterMenus = (except = null) => {
      agingBucketsFilterGrid?.querySelectorAll("details[open]").forEach((details) => { if (details !== except) details.open = false; });
      if (!except && agingBucketsFilterRoot) agingBucketsFilterRoot.open = false;
    };
    const syncAgingBucketsFilterChips = () => {
      if (!usesAgingBucketsWorkspace) return;
      const activeDefinitions = agingBucketsFilterDefinitions.filter(({ key }) => !isAgingBucketsFilterInactive(key));
      agingBucketsFilterChips.hidden = !activeDefinitions.length;
      agingBucketsFilterChips.innerHTML = activeDefinitions.map(({ key, label }) => `
        <div class="trendCollectionAppliedFilter${state.agingBucketsFilterEnabled[key] ? "" : " is-disabled"}">
          <button type="button" class="trendCollectionFilterVisibility" data-aging-buckets-filter-toggle="${escapeHtml(key)}" aria-pressed="${state.agingBucketsFilterEnabled[key] ? "true" : "false"}" aria-label="${state.agingBucketsFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter" title="${state.agingBucketsFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter"><i class="bi ${state.agingBucketsFilterEnabled[key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i></button>
          <button type="button" class="trendCollectionAppliedFilterBody" data-aging-buckets-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(label)} filter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(getAgingBucketsFilterDisplay(key))}</strong></button>
          <button type="button" class="trendCollectionFilterRemove" data-aging-buckets-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
        </div>`).join("") + (activeDefinitions.length ? `<button type="button" class="trendCollectionClearAll" data-aging-buckets-filter-reset="all">Clear all</button>` : "");
    };
    const syncAgingBucketsFilterGrid = (openKey = null) => {
      if (!usesAgingBucketsWorkspace) return;
      const rootWasOpen = agingBucketsFilterRoot.open;
      agingBucketsFilterGrid.innerHTML = agingBucketsFilterDefinitions.map(({ key, label }) => {
        const catalog = agingBucketsCatalogs[key] || [];
        const selected = state.agingBucketsFilters[key] || new Set();
        const available = getAgingBucketsAvailableValues(key);
        const searchValue = String(agingBucketsFilterSearches[key] || "");
        const normalizedSearch = searchValue.trim().toLowerCase();
        const visibleOptions = catalog.filter((value) => !normalizedSearch || String(value).toLowerCase().includes(normalizedSearch));
        return `<details class="trendCollectionFilterSelect" data-aging-buckets-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
          <summary aria-label="Select ${escapeHtml(label)} filter values"><span class="trendCollectionFilterSummaryText"><span class="trendCollectionFilterLabel">${escapeHtml(label)}</span><span class="trendCollectionFilterValue">${escapeHtml(getAgingBucketsFilterSummary(key))}</span></span><i class="bi bi-chevron-right" aria-hidden="true"></i></summary>
          <div class="trendCollectionFilterMenu">${catalog.length > 8 ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} options" />` : ""}
            <div class="trendCollectionFilterActions"><button type="button" data-aging-buckets-filter-action="all">Select all</button><button type="button" data-aging-buckets-filter-action="clear">Clear</button></div>
            <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => { const isSelected = selected.has(value); const isUnavailable = !available.has(value); return `<label class="trendCollectionFilterOption${isUnavailable ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-aging-buckets-filter-value="${escapeHtml(value)}"${isSelected ? " checked" : ""}${isUnavailable && !isSelected ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`; }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div>
          </div></details>`;
      }).join("");
      agingBucketsFilterRoot.open = rootWasOpen || Boolean(openKey);
      agingBucketsFilterGrid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => details.addEventListener("toggle", () => { if (details.open) closeAgingBucketsFilterMenus(details); }));
    };
    const syncAgingBucketsResultState = (result) => {
      if (!usesAgingBucketsWorkspace) return;
      const hasData = Boolean(result?.hasData);
      agingBucketsNoData.hidden = hasData;
      const canvas = $("trendAgingBucketsChart");
      if (canvas) { canvas.style.opacity = hasData ? "1" : "0.12"; canvas.style.pointerEvents = hasData ? "auto" : "none"; }
      const configured = agingBucketsFilterDefinitions.filter(({ key }) => !isAgingBucketsFilterInactive(key));
      const activeCount = configured.filter(({ key }) => state.agingBucketsFilterEnabled[key]).length;
      const pausedCount = configured.length - activeCount;
      if (!agingBucketsScopeMeta) return;
      if (!activeCount && !pausedCount) { agingBucketsScopeMeta.textContent = "Outstanding value movement by aging bucket"; return; }
      const matchingRows = getCurrentAgingBucketsRows().filter((row) => agingBucketsRowMatches(row, state.agingBucketsFilters, null, state.agingBucketsFilterEnabled));
      const customers = new Set(matchingRows.map((row) => row.customerName)).size;
      agingBucketsScopeMeta.textContent = `${activeCount} filter${activeCount === 1 ? "" : "s"} applied${pausedCount ? ` | ${pausedCount} paused` : ""} | ${customers} customer${customers === 1 ? "" : "s"}`;
    };
    const syncAgingBucketsWorkspace = (openKey = null, rerenderChart = true) => {
      if (!usesAgingBucketsWorkspace) return;
      syncAgingBucketsFilterGrid(openKey);
      syncAgingBucketsFilterChips();
      comparisonWorkspaces.agingBuckets?.sync();
      if (rerenderChart) syncAgingBucketsResultState(renderAgingBucketsChart(state.currentTrendPoints, getAgingBucketsContext()));
    };
    const resetAgingBucketsFilters = (key = "all") => {
      agingBucketsFilterDefinitions.forEach((definition) => {
        if (key !== "all" && definition.key !== key) return;
        state.agingBucketsFilters[definition.key] = new Set();
        state.agingBucketsFilterEnabled[definition.key] = true;
        agingBucketsFilterSearches[definition.key] = "";
      });
      syncAgingBucketsWorkspace();
    };

    const getCurrentCnAdvRows = () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []);
    const isCnAdvFilterInactive = (key) => !(state.cnAdvFilters[key] instanceof Set) || !state.cnAdvFilters[key].size;
    const getCnAdvAvailableValues = (key) => new Set(getCurrentCnAdvRows().filter((row) => cnAdvRowMatches(row, state.cnAdvFilters, key, state.cnAdvFilterEnabled)).map((row) => row[key]).filter(Boolean));
    const getCnAdvFilterSummary = (key) => {
      const selected = state.cnAdvFilters[key] || new Set();
      if (!selected.size) return "Nothing selected";
      if (selected.size === (cnAdvCatalogs[key] || []).length) return "All selected";
      return selected.size === 1 ? [...selected][0] : `${selected.size} selected`;
    };
    const getCnAdvFilterDisplay = (key) => {
      const selected = [...(state.cnAdvFilters[key] || new Set())];
      if (!selected.length) return "Nothing selected";
      if (selected.length === (cnAdvCatalogs[key] || []).length) return "All selected";
      return selected.length <= 2 ? selected.join(", ") : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
    };
    const getCnAdvContext = () => ({
      filters: state.cnAdvFilters,
      enabledFilters: state.cnAdvFilterEnabled,
      comparison: comparisonWorkspaces.cnAdv?.getComparison() || state.cnAdvComparison,
      periodComparison: state.currentGlobalPeriodComparison
    });
    const closeCnAdvFilterMenus = (except = null) => {
      cnAdvFilterGrid?.querySelectorAll("details[open]").forEach((details) => { if (details !== except) details.open = false; });
      if (!except && cnAdvFilterRoot) cnAdvFilterRoot.open = false;
    };
    const syncCnAdvFilterChips = () => {
      if (!usesCnAdvWorkspace) return;
      const activeDefinitions = cnAdvFilterDefinitions.filter(({ key }) => !isCnAdvFilterInactive(key));
      cnAdvFilterChips.hidden = !activeDefinitions.length;
      cnAdvFilterChips.innerHTML = activeDefinitions.map(({ key, label }) => `<div class="trendCollectionAppliedFilter${state.cnAdvFilterEnabled[key] ? "" : " is-disabled"}">
        <button type="button" class="trendCollectionFilterVisibility" data-cn-adv-filter-toggle="${escapeHtml(key)}" aria-pressed="${state.cnAdvFilterEnabled[key] ? "true" : "false"}" aria-label="${state.cnAdvFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter" title="${state.cnAdvFilterEnabled[key] ? "Disable" : "Enable"} ${escapeHtml(label)} filter"><i class="bi ${state.cnAdvFilterEnabled[key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i></button>
        <button type="button" class="trendCollectionAppliedFilterBody" data-cn-adv-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(label)} filter"><span>${escapeHtml(label)}</span><strong>${escapeHtml(getCnAdvFilterDisplay(key))}</strong></button>
        <button type="button" class="trendCollectionFilterRemove" data-cn-adv-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
      </div>`).join("") + (activeDefinitions.length ? `<button type="button" class="trendCollectionClearAll" data-cn-adv-filter-reset="all">Clear all</button>` : "");
    };
    const syncCnAdvFilterGrid = (openKey = null) => {
      if (!usesCnAdvWorkspace) return;
      const rootWasOpen = cnAdvFilterRoot.open;
      cnAdvFilterGrid.innerHTML = cnAdvFilterDefinitions.map(({ key, label }) => {
        const catalog = cnAdvCatalogs[key] || [];
        const selected = state.cnAdvFilters[key] || new Set();
        const available = getCnAdvAvailableValues(key);
        const searchValue = String(cnAdvFilterSearches[key] || "");
        const term = searchValue.trim().toLowerCase();
        const visibleOptions = catalog.filter((value) => !term || String(value).toLowerCase().includes(term));
        return `<details class="trendCollectionFilterSelect" data-cn-adv-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
          <summary aria-label="Select ${escapeHtml(label)} filter values"><span class="trendCollectionFilterSummaryText"><span class="trendCollectionFilterLabel">${escapeHtml(label)}</span><span class="trendCollectionFilterValue">${escapeHtml(getCnAdvFilterSummary(key))}</span></span><i class="bi bi-chevron-right" aria-hidden="true"></i></summary>
          <div class="trendCollectionFilterMenu">${catalog.length > 8 ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} options" />` : ""}<div class="trendCollectionFilterActions"><button type="button" data-cn-adv-filter-action="all">Select all</button><button type="button" data-cn-adv-filter-action="clear">Clear</button></div>
          <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => { const isSelected = selected.has(value); const isUnavailable = !available.has(value); return `<label class="trendCollectionFilterOption${isUnavailable ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-cn-adv-filter-value="${escapeHtml(value)}"${isSelected ? " checked" : ""}${isUnavailable && !isSelected ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`; }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div></div></details>`;
      }).join("");
      cnAdvFilterRoot.open = rootWasOpen || Boolean(openKey);
      cnAdvFilterGrid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => details.addEventListener("toggle", () => { if (details.open) closeCnAdvFilterMenus(details); }));
    };
    const syncCnAdvResultState = (result) => {
      if (!usesCnAdvWorkspace) return;
      const hasData = Boolean(result?.hasData);
      cnAdvNoData.hidden = hasData;
      const canvas = $("trendCnAdvChart");
      if (canvas) { canvas.style.opacity = hasData ? "1" : "0.12"; canvas.style.pointerEvents = hasData ? "auto" : "none"; }
      const configured = cnAdvFilterDefinitions.filter(({ key }) => !isCnAdvFilterInactive(key));
      const activeCount = configured.filter(({ key }) => state.cnAdvFilterEnabled[key]).length;
      const pausedCount = configured.length - activeCount;
      if (!cnAdvScopeMeta) return;
      if (!activeCount && !pausedCount) { cnAdvScopeMeta.textContent = "CN and advance value added versus utilised"; return; }
      const customers = new Set(getCurrentCnAdvRows().filter((row) => cnAdvRowMatches(row, state.cnAdvFilters, null, state.cnAdvFilterEnabled)).map((row) => row.customerName)).size;
      cnAdvScopeMeta.textContent = `${activeCount} filter${activeCount === 1 ? "" : "s"} applied${pausedCount ? ` | ${pausedCount} paused` : ""} | ${customers} customer${customers === 1 ? "" : "s"}`;
    };
    const syncCnAdvWorkspace = (openKey = null, rerenderChart = true) => {
      if (!usesCnAdvWorkspace) return;
      syncCnAdvFilterGrid(openKey);
      syncCnAdvFilterChips();
      comparisonWorkspaces.cnAdv?.sync();
      if (rerenderChart) syncCnAdvResultState(renderCnAdvChart(state.currentTrendPoints, getCnAdvContext()));
    };
    const resetCnAdvFilters = (key = "all") => {
      cnAdvFilterDefinitions.forEach((definition) => {
        if (key !== "all" && definition.key !== key) return;
        state.cnAdvFilters[definition.key] = new Set();
        state.cnAdvFilterEnabled[definition.key] = true;
        cnAdvFilterSearches[definition.key] = "";
      });
      syncCnAdvWorkspace();
    };

    const createFinancialRiskWorkspace = ({
      id,
      label,
      defaultMeta,
      metricKey,
      tray,
      root,
      grid,
      chips,
      noData,
      noDataClear,
      scopeMeta,
      isAvailable,
      renderMetric
    }) => {
      const filtersKey = `${id}Filters`;
      const enabledKey = `${id}FilterEnabled`;
      const searches = id === "provisioning" ? provisioningFilterSearches : writtenOffFilterSearches;
      const attrPrefix = id === "provisioning" ? "provisioning" : "written-off";
      if (!(tray && root && grid && chips && noData) || !isAvailable) return null;
      const getRows = () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []);
      const isInactive = (key) => !(state[filtersKey][key] instanceof Set) || !state[filtersKey][key].size;
      const getAvailable = (key) => new Set(getRows()
        .filter((row) => financialRiskRowMatches(row, state[filtersKey], key, state[enabledKey]))
        .map((row) => row[key]).filter(Boolean));
      const getSummary = (key) => {
        const selected = state[filtersKey][key] || new Set();
        if (!selected.size) return "Nothing selected";
        if (selected.size === (financialRiskCatalogs[key] || []).length) return "All selected";
        return selected.size === 1 ? [...selected][0] : `${selected.size} selected`;
      };
      const getDisplay = (key) => {
        const selected = [...(state[filtersKey][key] || new Set())];
        if (!selected.length) return "Nothing selected";
        if (selected.length === (financialRiskCatalogs[key] || []).length) return "All selected";
        return selected.length <= 2 ? selected.join(", ") : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;
      };
      const getContext = () => ({
        filters: state[filtersKey],
        enabledFilters: state[enabledKey],
        comparison: comparisonWorkspaces[id]?.getComparison() || state[`${id}Comparison`],
        periodComparison: state.currentGlobalPeriodComparison
      });
      const closeMenus = (except = null) => {
        grid.querySelectorAll("details[open]").forEach((details) => { if (details !== except) details.open = false; });
        if (!except) root.open = false;
      };
      const syncChips = () => {
        const activeDefinitions = financialRiskFilterDefinitions.filter(({ key }) => !isInactive(key));
        chips.hidden = !activeDefinitions.length;
        chips.innerHTML = activeDefinitions.map(({ key, label: filterLabel }) => `<div class="trendCollectionAppliedFilter${state[enabledKey][key] ? "" : " is-disabled"}">
          <button type="button" class="trendCollectionFilterVisibility" data-${attrPrefix}-filter-toggle="${escapeHtml(key)}" aria-pressed="${state[enabledKey][key] ? "true" : "false"}" aria-label="${state[enabledKey][key] ? "Disable" : "Enable"} ${escapeHtml(filterLabel)} filter" title="${state[enabledKey][key] ? "Disable" : "Enable"} ${escapeHtml(filterLabel)} filter"><i class="bi ${state[enabledKey][key] ? "bi-eye" : "bi-eye-slash"}" aria-hidden="true"></i></button>
          <button type="button" class="trendCollectionAppliedFilterBody" data-${attrPrefix}-filter-edit="${escapeHtml(key)}" aria-label="Edit ${escapeHtml(filterLabel)} filter"><span>${escapeHtml(filterLabel)}</span><strong>${escapeHtml(getDisplay(key))}</strong></button>
          <button type="button" class="trendCollectionFilterRemove" data-${attrPrefix}-filter-reset="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(filterLabel)} filter" title="Remove ${escapeHtml(filterLabel)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
        </div>`).join("") + (activeDefinitions.length ? `<button type="button" class="trendCollectionClearAll" data-${attrPrefix}-filter-reset="all">Clear all</button>` : "");
      };
      const syncGrid = (openKey = null) => {
        const rootWasOpen = root.open;
        grid.innerHTML = financialRiskFilterDefinitions.map(({ key, label: filterLabel }) => {
          const catalog = financialRiskCatalogs[key] || [];
          const selected = state[filtersKey][key] || new Set();
          const available = getAvailable(key);
          const searchValue = String(searches[key] || "");
          const term = searchValue.trim().toLowerCase();
          const visibleOptions = catalog.filter((value) => !term || String(value).toLowerCase().includes(term));
          return `<details class="trendCollectionFilterSelect" data-${attrPrefix}-filter-key="${escapeHtml(key)}"${openKey === key ? " open" : ""}>
            <summary aria-label="Select ${escapeHtml(filterLabel)} filter values"><span class="trendCollectionFilterSummaryText"><span class="trendCollectionFilterLabel">${escapeHtml(filterLabel)}</span><span class="trendCollectionFilterValue">${escapeHtml(getSummary(key))}</span></span><i class="bi bi-chevron-right" aria-hidden="true"></i></summary>
            <div class="trendCollectionFilterMenu">${catalog.length > 8 ? `<input type="search" class="trendCollectionFilterSearch" value="${escapeHtml(searchValue)}" placeholder="Search ${escapeHtml(filterLabel.toLowerCase())}" aria-label="Search ${escapeHtml(filterLabel)} options" />` : ""}<div class="trendCollectionFilterActions"><button type="button" data-${attrPrefix}-filter-action="all">Select all</button><button type="button" data-${attrPrefix}-filter-action="clear">Clear</button></div>
            <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => { const selectedValue = selected.has(value); const unavailable = !available.has(value); return `<label class="trendCollectionFilterOption${unavailable ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-${attrPrefix}-filter-value="${escapeHtml(value)}"${selectedValue ? " checked" : ""}${unavailable && !selectedValue ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`; }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div></div></details>`;
        }).join("");
        root.open = rootWasOpen || Boolean(openKey);
        grid.querySelectorAll(".trendCollectionFilterSelect").forEach((details) => details.addEventListener("toggle", () => { if (details.open) closeMenus(details); }));
      };
      const syncResult = (result) => {
        const hasData = Boolean(result?.hasData);
        noData.hidden = hasData;
        const canvas = $(`trend${id === "provisioning" ? "Provisioning" : "WrittenOff"}Chart`);
        if (canvas) { canvas.style.opacity = hasData ? "1" : "0.12"; canvas.style.pointerEvents = hasData ? "auto" : "none"; }
        const configured = financialRiskFilterDefinitions.filter(({ key }) => !isInactive(key));
        const activeCount = configured.filter(({ key }) => state[enabledKey][key]).length;
        const pausedCount = configured.length - activeCount;
        if (!scopeMeta) return;
        if (!activeCount && !pausedCount) { scopeMeta.textContent = defaultMeta; return; }
        const customers = new Set(getRows().filter((row) => financialRiskRowMatches(row, state[filtersKey], null, state[enabledKey])).map((row) => row.customerName)).size;
        scopeMeta.textContent = `${activeCount} filter${activeCount === 1 ? "" : "s"} applied${pausedCount ? ` | ${pausedCount} paused` : ""} | ${customers} customer${customers === 1 ? "" : "s"}`;
      };
      const sync = (openKey = null, rerenderChart = true) => {
        syncGrid(openKey);
        syncChips();
        comparisonWorkspaces[id]?.sync();
        if (rerenderChart) syncResult(renderMetric(state.currentTrendPoints, getContext()));
      };
      const reset = (key = "all") => {
        financialRiskFilterDefinitions.forEach((definition) => {
          if (key !== "all" && definition.key !== key) return;
          state[filtersKey][definition.key] = new Set();
          state[enabledKey][definition.key] = true;
          searches[definition.key] = "";
        });
        sync();
      };
      grid.addEventListener("click", (event) => {
        const button = event.target.closest(`[data-${attrPrefix}-filter-action]`);
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const key = button.closest(`[data-${attrPrefix}-filter-key]`)?.dataset[`${id}FilterKey`];
        if (!key || !financialRiskCatalogs[key]) return;
        state[filtersKey][key] = button.dataset[`${id}FilterAction`] === "clear" ? new Set() : new Set(financialRiskCatalogs[key]);
        sync(key);
      });
      grid.addEventListener("change", (event) => {
        const checkbox = event.target.closest(`[data-${attrPrefix}-filter-value]`);
        if (!(checkbox instanceof HTMLInputElement)) return;
        const key = checkbox.closest(`[data-${attrPrefix}-filter-key]`)?.dataset[`${id}FilterKey`];
        if (!key || !(state[filtersKey][key] instanceof Set)) return;
        if (checkbox.checked) state[filtersKey][key].add(checkbox.value);
        else state[filtersKey][key].delete(checkbox.value);
        sync(key);
      });
      grid.addEventListener("input", (event) => {
        const input = event.target.closest(".trendCollectionFilterSearch");
        if (!(input instanceof HTMLInputElement)) return;
        const key = input.closest(`[data-${attrPrefix}-filter-key]`)?.dataset[`${id}FilterKey`];
        if (!key) return;
        searches[key] = input.value;
        const term = input.value.trim().toLowerCase();
        input.closest(`[data-${attrPrefix}-filter-key]`)?.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
          const optionLabel = option.querySelector("span")?.textContent?.toLowerCase() || "";
          option.hidden = Boolean(term && !optionLabel.includes(term));
        });
      });
      chips.addEventListener("click", (event) => {
        const toggle = event.target.closest(`[data-${attrPrefix}-filter-toggle]`);
        if (toggle) {
          const key = toggle.dataset[`${id}FilterToggle`];
          if (!Object.prototype.hasOwnProperty.call(state[enabledKey], key)) return;
          state[enabledKey][key] = !state[enabledKey][key];
          sync();
          return;
        }
        const edit = event.target.closest(`[data-${attrPrefix}-filter-edit]`);
        if (edit) { sync(edit.dataset[`${id}FilterEdit`]); grid.querySelector(".trendCollectionFilterSelect summary")?.focus(); return; }
        const resetButton = event.target.closest(`[data-${attrPrefix}-filter-reset]`);
        if (resetButton) reset(resetButton.dataset[`${id}FilterReset`] || "all");
      });
      noDataClear?.addEventListener("click", () => reset("all"));
      return { root, sync, syncResult, getContext, closeMenus };
    };

    const provisioningWorkspace = createFinancialRiskWorkspace({
      id: "provisioning", label: "Provisioning", defaultMeta: "Provision value movement across the selected period", metricKey: "provisioningCr",
      tray: provisioningFilterTray, root: provisioningFilterRoot, grid: provisioningFilterGrid, chips: provisioningFilterChips, noData: provisioningNoData, noDataClear: provisioningNoDataClear, scopeMeta: provisioningScopeMeta,
      isAvailable: usesProvisioningWorkspace, renderMetric: renderProvisioningChart
    });
    const writtenOffWorkspace = createFinancialRiskWorkspace({
      id: "writtenOff", label: "Written Off", defaultMeta: "Written-off value movement across the selected period", metricKey: "writtenOffCr",
      tray: writtenOffFilterTray, root: writtenOffFilterRoot, grid: writtenOffFilterGrid, chips: writtenOffFilterChips, noData: writtenOffNoData, noDataClear: writtenOffNoDataClear, scopeMeta: writtenOffScopeMeta,
      isAvailable: usesWrittenOffWorkspace, renderMetric: renderWrittenOffChart
    });

    const createComparisonWorkspace = ({ id, definitions, catalogs, filtersKey, enabledKey, tray, chips, getRows, rowMatches, rerender, seriesKey = [] }) => {
      if (!document.querySelector(".agentDashboard")) return null;
      if (!tray || !chips || !state[`${id}Comparison`]) return null;
      const comparisonState = state[`${id}Comparison`];
      const searches = [{}, {}];
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "trendCompareToggle";
      toggle.setAttribute("data-trend-compare-toggle", id);
      const actionGroup = document.createElement("div");
      actionGroup.className = "trendCompareActions";
      tray.before(actionGroup);
      actionGroup.append(toggle, tray);

      const panel = document.createElement("div");
      panel.className = "trendComparisonPanel";
      panel.hidden = true;
      panel.setAttribute("data-trend-comparison-panel", id);
      chips.before(panel);

      const getConfiguredFilters = (group) => Object.fromEntries(
        Object.entries(group.filters || {}).filter(([, values]) => values instanceof Set && values.size)
      );
      const getGroupFilters = (group) => ({ ...state[filtersKey], ...getConfiguredFilters(group) });
      const getGroupEnabledFilters = (group) => ({
        ...state[enabledKey],
        ...Object.fromEntries(Object.keys(getConfiguredFilters(group)).map((key) => [key, true]))
      });
      const getAvailableValues = (group, key) => new Set(
        getRows()
          .filter((row) => rowMatches(row, getGroupFilters(group), key, getGroupEnabledFilters(group)))
          .map((row) => row[key])
          .filter(Boolean)
      );

      const getGroupSummary = (group, key) => {
        const values = [...(group.filters?.[key] || [])];
        if (!values.length) return "Choose values";
        return values.length === 1 ? values[0] : `${values.length} selected`;
      };
      const isGroupConfigured = (group) => Object.values(group.filters || {}).some((values) => values instanceof Set && values.size);
      const closeGroupMenus = (current) => {
        panel.querySelectorAll("details[open]").forEach((details) => {
          if (details !== current) details.open = false;
        });
      };

      const sync = () => {
        const configuredCount = comparisonState.groups.filter(isGroupConfigured).length;
        const isReady = comparisonState.enabled && configuredCount === 2;
        toggle.setAttribute("aria-pressed", comparisonState.enabled ? "true" : "false");
        toggle.setAttribute("aria-label", comparisonState.enabled ? "Disable comparison mode" : "Enable comparison mode");
        toggle.title = comparisonState.enabled ? "Disable comparison mode" : "Compare two filtered cohorts";
        toggle.innerHTML = `<i class="bi ${comparisonState.enabled ? "bi-bar-chart-line-fill" : "bi-bar-chart-line"}" aria-hidden="true"></i><span>${isReady ? "Comparing" : "Compare"}</span>`;
        panel.hidden = !comparisonState.enabled;
        if (!comparisonState.enabled) {
          panel.replaceChildren();
          return;
        }
        panel.innerHTML = `
          <div class="trendComparisonIntro">
            <strong>Compare two cohorts</strong>
            <span>Build each cohort with one or more filters. Values use OR; filters use AND.</span>
            <button type="button" data-trend-compare-reset="${id}">Reset</button>
          </div>
          <div class="trendComparisonGroups">
            ${comparisonState.groups.map((group, index) => {
              const selectedDefinitions = definitions.filter(({ key }) => group.filters?.[key] instanceof Set);
              const availableDefinitions = definitions.filter(({ key }) => !(group.filters?.[key] instanceof Set));
              const groupColor = comparisonPalette[index].primary;
              const comparisonKey = seriesKey.length
                ? `<div class="trendComparisonSeriesKey">${seriesKey.map(({ label, style = "solid" }) => `<span><i class="trendComparisonSeriesLine is-${escapeHtml(style)}" style="--comparison-series-color:${groupColor}"></i>${escapeHtml(label)}</span>`).join("")}</div>`
                : `<span class="trendComparisonCohortKey"><i style="--comparison-series-color:${groupColor}"></i>${index === 0 ? "Blue" : "Orange"} cohort</span>`;
              return `
                <section class="trendComparisonGroup" data-trend-compare-group="${index}">
                  <div class="trendComparisonGroupHeading"><span class="trendComparisonBadge">${index === 0 ? "A" : "B"}</span><strong>Comparison ${index === 0 ? "A" : "B"}</strong>${comparisonKey}</div>
                  <div class="trendComparisonGroupFilters">
                    ${selectedDefinitions.map(({ key, label }) => {
                      const catalog = catalogs[key] || [];
                      const available = getAvailableValues(group, key);
                      const term = String(searches[index][key] || "").trim().toLowerCase();
                      const visibleOptions = catalog.filter((value) => !term || String(value).toLowerCase().includes(term));
                      return `<div class="trendComparisonAppliedFilter">
                        <details class="trendComparisonValuePicker" data-trend-compare-values="${index}" data-trend-compare-key="${escapeHtml(key)}">
                          <summary><span>${escapeHtml(label)}</span><strong>${escapeHtml(getGroupSummary(group, key))}</strong><i class="bi bi-chevron-down" aria-hidden="true"></i></summary>
                          <div class="trendComparisonValueMenu">
                            ${catalog.length > 8 ? `<input type="search" class="trendComparisonSearch" data-trend-compare-search="${index}" data-trend-compare-key="${escapeHtml(key)}" placeholder="Search ${escapeHtml(label.toLowerCase())}" aria-label="Search ${escapeHtml(label)} values" />` : ""}
                            <div class="trendCollectionFilterActions"><button type="button" data-trend-compare-action="all" data-trend-compare-index="${index}" data-trend-compare-key="${escapeHtml(key)}">Select all</button><button type="button" data-trend-compare-action="clear" data-trend-compare-index="${index}" data-trend-compare-key="${escapeHtml(key)}">Clear</button></div>
                            <div class="trendCollectionFilterOptions">${visibleOptions.map((value) => {
                              const selected = group.filters[key].has(value);
                              const unavailable = !available.has(value);
                              return `<label class="trendCollectionFilterOption${unavailable ? " is-unavailable" : ""}"><input type="checkbox" value="${escapeHtml(value)}" data-trend-compare-value="${index}" data-trend-compare-key="${escapeHtml(key)}"${selected ? " checked" : ""}${unavailable && !selected ? " disabled" : ""} /><span>${escapeHtml(value)}</span></label>`;
                            }).join("") || `<div class="trendCollectionFilterOption is-unavailable">No matching options</div>`}</div>
                          </div>
                        </details>
                        <button type="button" class="trendComparisonFilterRemove" data-trend-compare-remove="${index}" data-trend-compare-key="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(label)} filter" title="Remove ${escapeHtml(label)} filter"><i class="bi bi-x" aria-hidden="true"></i></button>
                      </div>`;
                    }).join("")}
                    ${availableDefinitions.length ? `<details class="trendComparisonAddFilter" data-trend-compare-add="${index}">
                      <summary><i class="bi bi-plus-lg" aria-hidden="true"></i>Add filter</summary>
                      <div class="trendComparisonAddMenu">${availableDefinitions.map(({ key, label }) => `<button type="button" data-trend-compare-add-filter="${index}" data-trend-compare-key="${escapeHtml(key)}">${escapeHtml(label)}</button>`).join("")}</div>
                    </details>` : ""}
                    ${selectedDefinitions.length ? "" : `<div class="trendComparisonPlaceholder">Add Agent, Customer, or another filter.</div>`}
                  </div>
                </section>`;
            }).join("")}
          </div>
          <div class="trendComparisonStatus${isReady ? " is-ready" : ""}">${isReady ? "Comparison is active. Colours identify cohorts; line style identifies the original measure." : "Configure both cohorts to compare their trends."}</div>`;
      };

      toggle.addEventListener("click", () => {
        comparisonState.enabled = !comparisonState.enabled;
        sync();
        rerender();
      });
      panel.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-trend-compare-value]");
        if (!(checkbox instanceof HTMLInputElement)) return;
        const index = Number(checkbox.dataset.trendCompareValue);
        const key = checkbox.dataset.trendCompareKey;
        const group = comparisonState.groups[index];
        if (!group?.filters?.[key]) return;
        if (checkbox.checked) group.filters[key].add(checkbox.value);
        else group.filters[key].delete(checkbox.value);
        sync();
        rerender();
      });
      panel.addEventListener("click", (event) => {
        const action = event.target.closest("[data-trend-compare-action]");
        if (action) {
          const index = Number(action.dataset.trendCompareIndex);
          const key = action.dataset.trendCompareKey;
          const group = comparisonState.groups[index];
          if (!group?.filters?.[key]) return;
          group.filters[key] = action.dataset.trendCompareAction === "clear" ? new Set() : new Set(catalogs[key] || []);
          sync();
          rerender();
          return;
        }
        const add = event.target.closest("[data-trend-compare-add-filter]");
        if (add) {
          const index = Number(add.dataset.trendCompareAddFilter);
          const key = add.dataset.trendCompareKey;
          if (!comparisonState.groups[index] || !definitions.some((definition) => definition.key === key)) return;
          comparisonState.groups[index].filters[key] = new Set();
          sync();
          rerender();
          return;
        }
        const remove = event.target.closest("[data-trend-compare-remove]");
        if (remove) {
          const index = Number(remove.dataset.trendCompareRemove);
          const key = remove.dataset.trendCompareKey;
          delete comparisonState.groups[index]?.filters?.[key];
          delete searches[index]?.[key];
          sync();
          rerender();
          return;
        }
        const reset = event.target.closest("[data-trend-compare-reset]");
        if (reset) {
          comparisonState.groups = [{ filters: {} }, { filters: {} }];
          searches[0] = {};
          searches[1] = {};
          sync();
          rerender();
        }
      });
      panel.addEventListener("input", (event) => {
        const input = event.target.closest("[data-trend-compare-search]");
        if (!(input instanceof HTMLInputElement)) return;
        const index = Number(input.dataset.trendCompareSearch);
        const key = input.dataset.trendCompareKey;
        if (!comparisonState.groups[index]?.filters?.[key]) return;
        searches[index][key] = input.value;
        const term = input.value.trim().toLowerCase();
        input.closest(".trendComparisonValueMenu")?.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
          const text = option.querySelector("span")?.textContent?.toLowerCase() || "";
          option.hidden = Boolean(term && !text.includes(term));
        });
      });
      panel.addEventListener("toggle", (event) => {
        const details = event.target;
        if (details instanceof HTMLDetailsElement && details.open) closeGroupMenus(details);
      }, true);
      return { sync, getComparison: () => comparisonState };
    };

    comparisonWorkspaces.collection = createComparisonWorkspace({
      id: "collection", definitions: collectionFilterDefinitions, catalogs: collectionCatalogs, filtersKey: "collectionFilters", enabledKey: "collectionFilterEnabled",
      tray: collectionFilterTray, chips: collectionFilterChips, getRows: getCurrentCollectionRows, rowMatches: collectionRowMatches, rerender: () => syncCollectionWorkspace(),
      seriesKey: [{ label: "Collection", style: "solid" }, { label: "New Billing", style: "dashed" }, { label: "PTP Target", style: "dotted" }]
    });
    comparisonWorkspaces.planPortfolio = createComparisonWorkspace({
      id: "planPortfolio", definitions: planPortfolioFilterDefinitions, catalogs: planPortfolioCatalogs, filtersKey: "planPortfolioFilters", enabledKey: "planPortfolioFilterEnabled",
      tray: planPortfolioFilterTray, chips: planPortfolioFilterChips, getRows: getCurrentPlanPortfolioRows, rowMatches: planPortfolioRowMatches, rerender: () => syncPlanPortfolioWorkspace()
    });
    comparisonWorkspaces.visits = createComparisonWorkspace({
      id: "visits", definitions: visitsAllFilterDefinitions, catalogs: visitsCatalogs, filtersKey: "visitsFilters", enabledKey: "visitsFilterEnabled",
      tray: visitsFilterTray, chips: visitsFilterChips, getRows: getCurrentVisitsRows, rowMatches: visitsRowMatches, rerender: () => syncVisitsWorkspace()
    });
    comparisonWorkspaces.invoiceSubmission = createComparisonWorkspace({
      id: "invoiceSubmission", definitions: invoiceSubmissionFilterDefinitions, catalogs: invoiceSubmissionCatalogs, filtersKey: "invoiceSubmissionFilters", enabledKey: "invoiceSubmissionFilterEnabled",
      tray: invoiceSubmissionFilterTray, chips: invoiceSubmissionFilterChips, getRows: getCurrentInvoiceSubmissionRows, rowMatches: invoiceSubmissionRowMatches, rerender: () => syncInvoiceSubmissionWorkspace()
    });
    comparisonWorkspaces.agingBuckets = createComparisonWorkspace({
      id: "agingBuckets", definitions: agingBucketsFilterDefinitions, catalogs: agingBucketsCatalogs, filtersKey: "agingBucketsFilters", enabledKey: "agingBucketsFilterEnabled",
      tray: agingBucketsFilterTray, chips: agingBucketsFilterChips, getRows: getCurrentAgingBucketsRows, rowMatches: agingBucketsRowMatches, rerender: () => syncAgingBucketsWorkspace()
    });
    comparisonWorkspaces.cnAdv = createComparisonWorkspace({
      id: "cnAdv", definitions: cnAdvFilterDefinitions, catalogs: cnAdvCatalogs, filtersKey: "cnAdvFilters", enabledKey: "cnAdvFilterEnabled",
      tray: cnAdvFilterTray, chips: cnAdvFilterChips, getRows: getCurrentCnAdvRows, rowMatches: cnAdvRowMatches, rerender: () => syncCnAdvWorkspace()
    });
    comparisonWorkspaces.provisioning = createComparisonWorkspace({
      id: "provisioning", definitions: financialRiskFilterDefinitions, catalogs: financialRiskCatalogs, filtersKey: "provisioningFilters", enabledKey: "provisioningFilterEnabled",
      tray: provisioningFilterTray, chips: provisioningFilterChips, getRows: () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []), rowMatches: financialRiskRowMatches, rerender: () => provisioningWorkspace?.sync()
    });
    comparisonWorkspaces.writtenOff = createComparisonWorkspace({
      id: "writtenOff", definitions: financialRiskFilterDefinitions, catalogs: financialRiskCatalogs, filtersKey: "writtenOffFilters", enabledKey: "writtenOffFilterEnabled",
      tray: writtenOffFilterTray, chips: writtenOffFilterChips, getRows: () => state.currentTrendPoints.flatMap((point) => point.collectionBreakdown || []), rowMatches: financialRiskRowMatches, rerender: () => writtenOffWorkspace?.sync()
    });

    const render = () => {
      syncTrendControls();
      const periodData = getPeriodData(
        state.range,
        state.activeYear,
        getActivePeriodKey(),
        usesMultiPeriodSelect ? state.selectedPeriods[state.range] : null
      );
      const globalPeriodGroups = getGlobalPeriodComparisonGroups();
      state.currentGlobalPeriodComparison = globalPeriodGroups
        ? { range: state.range, groups: globalPeriodGroups }
        : null;

      setText("trendSelectedPeriod", periodData.label || `${rangeLabels[state.range] || "Yearly"} | ${state.activeYear}`);
      state.currentTrendPoints = globalPeriodGroups?.[0]?.points || periodData.points;
      if (usesCollectionWorkspace) syncCollectionWorkspace(null, false);
      if (usesPlanPortfolioWorkspace) syncPlanPortfolioWorkspace(null, false);
      if (usesVisitsWorkspace) syncVisitsWorkspace(null, false);
      if (usesInvoiceSubmissionWorkspace) syncInvoiceSubmissionWorkspace(null, false);
      if (usesAgingBucketsWorkspace) syncAgingBucketsWorkspace(null, false);
      if (usesCnAdvWorkspace) syncCnAdvWorkspace(null, false);
      provisioningWorkspace?.sync(null, false);
      writtenOffWorkspace?.sync(null, false);
      const chartResults = renderCharts(
        periodData.points,
        periodData.closingStatus,
        usesCollectionWorkspace ? getCollectionContext() : null,
        usesInvoiceSubmissionWorkspace ? getInvoiceSubmissionContext() : null,
        usesAgingBucketsWorkspace ? getAgingBucketsContext() : null,
        usesCnAdvWorkspace ? getCnAdvContext() : null,
        provisioningWorkspace?.getContext() || null,
        writtenOffWorkspace?.getContext() || null
      );
      syncCollectionResultState(chartResults.collectionResult);
      if (usesInvoiceSubmissionWorkspace) syncInvoiceSubmissionResultState(chartResults.invoiceSubmissionResult);
      if (usesAgingBucketsWorkspace) syncAgingBucketsResultState(chartResults.agingBucketsResult);
      if (usesCnAdvWorkspace) syncCnAdvResultState(chartResults.cnAdvResult);
      provisioningWorkspace?.syncResult(chartResults.provisioningResult);
      writtenOffWorkspace?.syncResult(chartResults.writtenOffResult);
      if (usesPlanPortfolioWorkspace) syncPlanPortfolioResultState(renderPlanPortfolioChart(periodData.points, getPlanPortfolioContext()));
      if (usesVisitsWorkspace) syncVisitsResultState(renderVisitsChart(periodData.points, getVisitsContext()));

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
      const defaultToggleLabel = toggleBtn.dataset.trendLabel || "Trends";
      toggleBtn.title = showTrends ? "Now" : defaultToggleLabel;
      toggleBtn.setAttribute("aria-label", showTrends ? "Show current dashboard cards" : "Show performance trends");
      const textNode = toggleBtn.querySelector("[data-trend-toggle-text]");
      if (textNode) textNode.textContent = showTrends ? "Now" : defaultToggleLabel;

      if (showTrends) {
        requestAnimationFrame(() => {
          if (!state.hasRendered) render();
          else {
            Object.values(chartInstances).forEach((chart) => chart?.resize());
            Object.values(trendEchartInstances).forEach((chart) => chart?.resize());
          }
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
    collectionSeriesButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.trendCollectionSeries;
        if (!Object.prototype.hasOwnProperty.call(state.collectionSeriesVisibility, key)) return;
        const visibleCount = Object.values(state.collectionSeriesVisibility).filter(Boolean).length;
        if (state.collectionSeriesVisibility[key] && visibleCount === 1) return;
        state.collectionSeriesVisibility[key] = !state.collectionSeriesVisibility[key];
        syncCollectionHeaderControls();
        syncCollectionResultState(renderCollectionChart(state.currentTrendPoints, getCollectionContext()));
      });
    });
    planPortfolioSeriesButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.trendPlanSeries;
        if (!Object.prototype.hasOwnProperty.call(state.planPortfolioSeriesVisibility, key)) return;
        const visibleCount = Object.values(state.planPortfolioSeriesVisibility).filter(Boolean).length;
        if (state.planPortfolioSeriesVisibility[key] && visibleCount === 1) return;
        state.planPortfolioSeriesVisibility[key] = !state.planPortfolioSeriesVisibility[key];
        syncPlanPortfolioHeaderControls();
        syncPlanPortfolioResultState(renderPlanPortfolioChart(state.currentTrendPoints, getPlanPortfolioContext()));
      });
    });
    visitsSeriesButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.trendVisitsSeries;
        if (!Object.prototype.hasOwnProperty.call(state.visitsSeriesVisibility, key)) return;
        const visibleCount = Object.values(state.visitsSeriesVisibility).filter(Boolean).length;
        if (state.visitsSeriesVisibility[key] && visibleCount === 1) return;
        state.visitsSeriesVisibility[key] = !state.visitsSeriesVisibility[key];
        syncVisitsHeaderControls();
        syncVisitsResultState(renderVisitsChart(state.currentTrendPoints, getVisitsContext()));
      });
    });
    collectionFilterGrid?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-collection-filter-action]");
      if (!actionButton) return;
      event.preventDefault();
      event.stopPropagation();
      const details = actionButton.closest("[data-collection-filter-key]");
      const key = details?.dataset.collectionFilterKey;
      if (!key || !collectionCatalogs[key]) return;
      state.collectionFilters[key] = actionButton.dataset.collectionFilterAction === "clear"
        ? new Set()
        : new Set(collectionCatalogs[key]);
      syncCollectionWorkspace(key);
    });
    collectionFilterGrid?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-collection-filter-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      const details = checkbox.closest("[data-collection-filter-key]");
      const key = details?.dataset.collectionFilterKey;
      if (!key || !(state.collectionFilters[key] instanceof Set)) return;
      if (checkbox.checked) state.collectionFilters[key].add(checkbox.value);
      else state.collectionFilters[key].delete(checkbox.value);
      syncCollectionWorkspace(key);
    });
    collectionFilterGrid?.addEventListener("input", (event) => {
      const searchInput = event.target.closest(".trendCollectionFilterSearch");
      if (!(searchInput instanceof HTMLInputElement)) return;
      const details = searchInput.closest("[data-collection-filter-key]");
      const key = details?.dataset.collectionFilterKey;
      if (!key) return;
      collectionFilterSearches[key] = searchInput.value;
      const searchValue = searchInput.value.trim().toLowerCase();
      details.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
        const label = option.querySelector("span")?.textContent?.toLowerCase() || "";
        option.hidden = Boolean(searchValue && !label.includes(searchValue));
      });
    });
    collectionFilterChips?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-collection-filter-toggle]");
      if (toggleButton) {
        const key = toggleButton.dataset.collectionFilterToggle;
        if (!Object.prototype.hasOwnProperty.call(state.collectionFilterEnabled, key)) return;
        state.collectionFilterEnabled[key] = !state.collectionFilterEnabled[key];
        syncCollectionWorkspace();
        return;
      }
      const editButton = event.target.closest("[data-collection-filter-edit]");
      if (editButton) {
        event.stopPropagation();
        const key = editButton.dataset.collectionFilterEdit;
        if (!collectionCatalogs[key]) return;
        syncCollectionFilterGrid(key);
        collectionFilterGrid.querySelector(".trendCollectionFilterSelect summary")?.focus();
        return;
      }
      const resetButton = event.target.closest("[data-collection-filter-reset]");
      if (!resetButton) return;
      resetCollectionFilters(resetButton.dataset.collectionFilterReset || "all");
    });
    collectionNoDataClear?.addEventListener("click", () => resetCollectionFilters("all"));
    planPortfolioFilterGrid?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-plan-filter-action]");
      if (!actionButton) return;
      event.preventDefault();
      event.stopPropagation();
      const details = actionButton.closest("[data-plan-filter-key]");
      const key = details?.dataset.planFilterKey;
      if (!key || !planPortfolioCatalogs[key]) return;
      state.planPortfolioFilters[key] = actionButton.dataset.planFilterAction === "clear"
        ? new Set()
        : new Set(planPortfolioCatalogs[key]);
      syncPlanPortfolioWorkspace(key);
    });
    planPortfolioFilterGrid?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-plan-filter-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      const details = checkbox.closest("[data-plan-filter-key]");
      const key = details?.dataset.planFilterKey;
      if (!key || !(state.planPortfolioFilters[key] instanceof Set)) return;
      if (checkbox.checked) state.planPortfolioFilters[key].add(checkbox.value);
      else state.planPortfolioFilters[key].delete(checkbox.value);
      syncPlanPortfolioWorkspace(key);
    });
    planPortfolioFilterGrid?.addEventListener("input", (event) => {
      const searchInput = event.target.closest(".trendCollectionFilterSearch");
      if (!(searchInput instanceof HTMLInputElement)) return;
      const details = searchInput.closest("[data-plan-filter-key]");
      const key = details?.dataset.planFilterKey;
      if (!key) return;
      planPortfolioFilterSearches[key] = searchInput.value;
      const searchValue = searchInput.value.trim().toLowerCase();
      details.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
        const label = option.querySelector("span")?.textContent?.toLowerCase() || "";
        option.hidden = Boolean(searchValue && !label.includes(searchValue));
      });
    });
    planPortfolioFilterChips?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-plan-filter-toggle]");
      if (toggleButton) {
        const key = toggleButton.dataset.planFilterToggle;
        if (!Object.prototype.hasOwnProperty.call(state.planPortfolioFilterEnabled, key)) return;
        state.planPortfolioFilterEnabled[key] = !state.planPortfolioFilterEnabled[key];
        syncPlanPortfolioWorkspace();
        return;
      }
      const editButton = event.target.closest("[data-plan-filter-edit]");
      if (editButton) {
        event.stopPropagation();
        const key = editButton.dataset.planFilterEdit;
        if (!planPortfolioCatalogs[key]) return;
        syncPlanPortfolioFilterGrid(key);
        planPortfolioFilterGrid.querySelector(".trendCollectionFilterSelect summary")?.focus();
        return;
      }
      const resetButton = event.target.closest("[data-plan-filter-reset]");
      if (resetButton) resetPlanPortfolioFilters(resetButton.dataset.planFilterReset || "all");
    });
    planPortfolioNoDataClear?.addEventListener("click", () => resetPlanPortfolioFilters("all"));
    visitsFilterGrid?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-visits-filter-action]");
      if (!actionButton) return;
      event.preventDefault();
      event.stopPropagation();
      const details = actionButton.closest("[data-visits-filter-key]");
      const key = details?.dataset.visitsFilterKey;
      if (!key || !visitsCatalogs[key]) return;
      state.visitsFilters[key] = actionButton.dataset.visitsFilterAction === "clear" ? new Set() : new Set(visitsCatalogs[key]);
      syncVisitsWorkspace(key);
    });
    visitsFilterGrid?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-visits-filter-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      const key = checkbox.closest("[data-visits-filter-key]")?.dataset.visitsFilterKey;
      if (!key || !(state.visitsFilters[key] instanceof Set)) return;
      if (checkbox.checked) state.visitsFilters[key].add(checkbox.value);
      else state.visitsFilters[key].delete(checkbox.value);
      syncVisitsWorkspace(key);
    });
    visitsFilterGrid?.addEventListener("input", (event) => {
      const searchInput = event.target.closest(".trendCollectionFilterSearch");
      if (!(searchInput instanceof HTMLInputElement)) return;
      const key = searchInput.closest("[data-visits-filter-key]")?.dataset.visitsFilterKey;
      if (!key) return;
      visitsFilterSearches[key] = searchInput.value;
      const term = searchInput.value.trim().toLowerCase();
      searchInput.closest("[data-visits-filter-key]")?.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
        const label = option.querySelector("span")?.textContent?.toLowerCase() || "";
        option.hidden = Boolean(term && !label.includes(term));
      });
    });
    visitsCustomerSearch?.addEventListener("input", () => syncVisitsCustomerPicker());
    visitsCustomerOptions?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-visits-customer-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      if (checkbox.checked) state.visitsFilters.customerName.add(checkbox.value);
      else state.visitsFilters.customerName.delete(checkbox.value);
      syncVisitsWorkspace();
    });
    visitsCustomerPicker?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-visits-customer-action]");
      if (!actionButton) return;
      event.preventDefault();
      const options = getVisitCustomerOptions().map(({ name }) => name);
      state.visitsFilters.customerName = actionButton.dataset.visitsCustomerAction === "clear" ? new Set() : new Set(options);
      syncVisitsWorkspace();
    });
    visitsCustomerPicker?.addEventListener("toggle", () => {
      if (visitsCustomerPicker.open) closeVisitsFilterMenus();
    });
    visitsFilterChips?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-visits-filter-toggle]");
      if (toggleButton) {
        const key = toggleButton.dataset.visitsFilterToggle;
        if (!Object.prototype.hasOwnProperty.call(state.visitsFilterEnabled, key)) return;
        state.visitsFilterEnabled[key] = !state.visitsFilterEnabled[key];
        syncVisitsWorkspace();
        return;
      }
      const editButton = event.target.closest("[data-visits-filter-edit]");
      if (editButton) {
        const key = editButton.dataset.visitsFilterEdit;
        if (key === "customerName") { visitsCustomerPicker.open = true; visitsCustomerSearch.focus(); return; }
        syncVisitsFilterGrid(key);
        visitsFilterGrid.querySelector(".trendCollectionFilterSelect summary")?.focus();
        return;
      }
      const resetButton = event.target.closest("[data-visits-filter-reset]");
      if (resetButton) resetVisitsFilters(resetButton.dataset.visitsFilterReset || "all");
    });
    visitsNoDataClear?.addEventListener("click", () => resetVisitsFilters("all"));
    invoiceSubmissionFilterGrid?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-invoice-submission-filter-action]");
      if (!actionButton) return;
      event.preventDefault();
      event.stopPropagation();
      const key = actionButton.closest("[data-invoice-submission-filter-key]")?.dataset.invoiceSubmissionFilterKey;
      if (!key || !invoiceSubmissionCatalogs[key]) return;
      state.invoiceSubmissionFilters[key] = actionButton.dataset.invoiceSubmissionFilterAction === "clear"
        ? new Set()
        : new Set(invoiceSubmissionCatalogs[key]);
      syncInvoiceSubmissionWorkspace(key);
    });
    invoiceSubmissionFilterGrid?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-invoice-submission-filter-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      const key = checkbox.closest("[data-invoice-submission-filter-key]")?.dataset.invoiceSubmissionFilterKey;
      if (!key || !(state.invoiceSubmissionFilters[key] instanceof Set)) return;
      if (checkbox.checked) state.invoiceSubmissionFilters[key].add(checkbox.value);
      else state.invoiceSubmissionFilters[key].delete(checkbox.value);
      syncInvoiceSubmissionWorkspace(key);
    });
    invoiceSubmissionFilterGrid?.addEventListener("input", (event) => {
      const searchInput = event.target.closest(".trendCollectionFilterSearch");
      if (!(searchInput instanceof HTMLInputElement)) return;
      const key = searchInput.closest("[data-invoice-submission-filter-key]")?.dataset.invoiceSubmissionFilterKey;
      if (!key) return;
      invoiceSubmissionFilterSearches[key] = searchInput.value;
      const term = searchInput.value.trim().toLowerCase();
      searchInput.closest("[data-invoice-submission-filter-key]")?.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
        const label = option.querySelector("span")?.textContent?.toLowerCase() || "";
        option.hidden = Boolean(term && !label.includes(term));
      });
    });
    invoiceSubmissionFilterChips?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-invoice-submission-filter-toggle]");
      if (toggleButton) {
        const key = toggleButton.dataset.invoiceSubmissionFilterToggle;
        if (!Object.prototype.hasOwnProperty.call(state.invoiceSubmissionFilterEnabled, key)) return;
        state.invoiceSubmissionFilterEnabled[key] = !state.invoiceSubmissionFilterEnabled[key];
        syncInvoiceSubmissionWorkspace();
        return;
      }
      const editButton = event.target.closest("[data-invoice-submission-filter-edit]");
      if (editButton) {
        const key = editButton.dataset.invoiceSubmissionFilterEdit;
        if (!invoiceSubmissionCatalogs[key]) return;
        syncInvoiceSubmissionFilterGrid(key);
        invoiceSubmissionFilterGrid.querySelector(".trendCollectionFilterSelect summary")?.focus();
        return;
      }
      const resetButton = event.target.closest("[data-invoice-submission-filter-reset]");
      if (resetButton) resetInvoiceSubmissionFilters(resetButton.dataset.invoiceSubmissionFilterReset || "all");
    });
    invoiceSubmissionNoDataClear?.addEventListener("click", () => resetInvoiceSubmissionFilters("all"));
    agingBucketsFilterGrid?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-aging-buckets-filter-action]");
      if (!actionButton) return;
      event.preventDefault();
      event.stopPropagation();
      const key = actionButton.closest("[data-aging-buckets-filter-key]")?.dataset.agingBucketsFilterKey;
      if (!key || !agingBucketsCatalogs[key]) return;
      state.agingBucketsFilters[key] = actionButton.dataset.agingBucketsFilterAction === "clear" ? new Set() : new Set(agingBucketsCatalogs[key]);
      syncAgingBucketsWorkspace(key);
    });
    agingBucketsFilterGrid?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-aging-buckets-filter-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      const key = checkbox.closest("[data-aging-buckets-filter-key]")?.dataset.agingBucketsFilterKey;
      if (!key || !(state.agingBucketsFilters[key] instanceof Set)) return;
      if (checkbox.checked) state.agingBucketsFilters[key].add(checkbox.value);
      else state.agingBucketsFilters[key].delete(checkbox.value);
      syncAgingBucketsWorkspace(key);
    });
    agingBucketsFilterGrid?.addEventListener("input", (event) => {
      const searchInput = event.target.closest(".trendCollectionFilterSearch");
      if (!(searchInput instanceof HTMLInputElement)) return;
      const key = searchInput.closest("[data-aging-buckets-filter-key]")?.dataset.agingBucketsFilterKey;
      if (!key) return;
      agingBucketsFilterSearches[key] = searchInput.value;
      const term = searchInput.value.trim().toLowerCase();
      searchInput.closest("[data-aging-buckets-filter-key]")?.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
        const label = option.querySelector("span")?.textContent?.toLowerCase() || "";
        option.hidden = Boolean(term && !label.includes(term));
      });
    });
    agingBucketsFilterChips?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-aging-buckets-filter-toggle]");
      if (toggleButton) {
        const key = toggleButton.dataset.agingBucketsFilterToggle;
        if (!Object.prototype.hasOwnProperty.call(state.agingBucketsFilterEnabled, key)) return;
        state.agingBucketsFilterEnabled[key] = !state.agingBucketsFilterEnabled[key];
        syncAgingBucketsWorkspace();
        return;
      }
      const editButton = event.target.closest("[data-aging-buckets-filter-edit]");
      if (editButton) {
        const key = editButton.dataset.agingBucketsFilterEdit;
        if (!agingBucketsCatalogs[key]) return;
        syncAgingBucketsFilterGrid(key);
        agingBucketsFilterGrid.querySelector(".trendCollectionFilterSelect summary")?.focus();
        return;
      }
      const resetButton = event.target.closest("[data-aging-buckets-filter-reset]");
      if (resetButton) resetAgingBucketsFilters(resetButton.dataset.agingBucketsFilterReset || "all");
    });
    agingBucketsNoDataClear?.addEventListener("click", () => resetAgingBucketsFilters("all"));
    cnAdvFilterGrid?.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-cn-adv-filter-action]");
      if (!actionButton) return;
      event.preventDefault();
      event.stopPropagation();
      const key = actionButton.closest("[data-cn-adv-filter-key]")?.dataset.cnAdvFilterKey;
      if (!key || !cnAdvCatalogs[key]) return;
      state.cnAdvFilters[key] = actionButton.dataset.cnAdvFilterAction === "clear" ? new Set() : new Set(cnAdvCatalogs[key]);
      syncCnAdvWorkspace(key);
    });
    cnAdvFilterGrid?.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-cn-adv-filter-value]");
      if (!(checkbox instanceof HTMLInputElement)) return;
      const key = checkbox.closest("[data-cn-adv-filter-key]")?.dataset.cnAdvFilterKey;
      if (!key || !(state.cnAdvFilters[key] instanceof Set)) return;
      if (checkbox.checked) state.cnAdvFilters[key].add(checkbox.value);
      else state.cnAdvFilters[key].delete(checkbox.value);
      syncCnAdvWorkspace(key);
    });
    cnAdvFilterGrid?.addEventListener("input", (event) => {
      const searchInput = event.target.closest(".trendCollectionFilterSearch");
      if (!(searchInput instanceof HTMLInputElement)) return;
      const key = searchInput.closest("[data-cn-adv-filter-key]")?.dataset.cnAdvFilterKey;
      if (!key) return;
      cnAdvFilterSearches[key] = searchInput.value;
      const term = searchInput.value.trim().toLowerCase();
      searchInput.closest("[data-cn-adv-filter-key]")?.querySelectorAll(".trendCollectionFilterOption").forEach((option) => {
        const label = option.querySelector("span")?.textContent?.toLowerCase() || "";
        option.hidden = Boolean(term && !label.includes(term));
      });
    });
    cnAdvFilterChips?.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-cn-adv-filter-toggle]");
      if (toggleButton) {
        const key = toggleButton.dataset.cnAdvFilterToggle;
        if (!Object.prototype.hasOwnProperty.call(state.cnAdvFilterEnabled, key)) return;
        state.cnAdvFilterEnabled[key] = !state.cnAdvFilterEnabled[key];
        syncCnAdvWorkspace();
        return;
      }
      const editButton = event.target.closest("[data-cn-adv-filter-edit]");
      if (editButton) {
        const key = editButton.dataset.cnAdvFilterEdit;
        if (!cnAdvCatalogs[key]) return;
        syncCnAdvFilterGrid(key);
        cnAdvFilterGrid.querySelector(".trendCollectionFilterSelect summary")?.focus();
        return;
      }
      const resetButton = event.target.closest("[data-cn-adv-filter-reset]");
      if (resetButton) resetCnAdvFilters(resetButton.dataset.cnAdvFilterReset || "all");
    });
    cnAdvNoDataClear?.addEventListener("click", () => resetCnAdvFilters("all"));
    periodSelect.addEventListener("change", (event) => {
      if (state.range === "quarterly") state.activeQuarter = event.target.value || CURRENT_QUARTER_KEY;
      if (state.range === "monthly") state.activeMonth = event.target.value || CURRENT_MONTH_KEY;
      resetStatusDrill();
      if (state.isTrendsVisible) render();
    });
    multiPeriodMenu?.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !input.matches("[data-trend-period-value]")) return;
      const selectedValues = Array.from(multiPeriodMenu.querySelectorAll("input[data-trend-period-value]:checked"))
        .map((checkbox) => checkbox.value);
      if (!selectedValues.length) {
        input.checked = true;
        return;
      }
      state.selectedPeriods[state.range] = selectedValues;
      resetStatusDrill();
      if (state.isTrendsVisible) render();
      else syncMultiPeriodSelect();
    });
    globalPeriodCompareToggle?.addEventListener("click", () => {
      if (globalPeriodCompareToggle.disabled) return;
      state.globalPeriodComparison.enabled = !state.globalPeriodComparison.enabled;
      syncGlobalPeriodCompare();
      resetStatusDrill();
      if (state.isTrendsVisible) render();
    });
    globalPeriodCompareSelects.forEach((select) => {
      select.addEventListener("change", () => {
        const nextValues = globalPeriodCompareSelects.map((picker) => picker.value);
        if (nextValues[0] === nextValues[1]) {
          const alternatives = getMultiPeriodOptions().map((option) => option.value)
            .filter((value) => value !== nextValues[0]);
          nextValues[select.dataset.globalPeriodComparison === "a" ? 0 : 1] = alternatives[0] || nextValues[select.dataset.globalPeriodComparison === "a" ? 1 : 0];
        }
        state.globalPeriodComparison.values = nextValues;
        resetStatusDrill();
        if (state.isTrendsVisible) render();
        else syncGlobalPeriodCompare();
      });
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
    document.addEventListener("click", (event) => {
      if (!collectionFilterRoot?.contains(event.target)) closeCollectionFilterMenus();
      if (!planPortfolioFilterRoot?.contains(event.target)) closePlanPortfolioFilterMenus();
      if (!visitsFilterRoot?.contains(event.target)) closeVisitsFilterMenus();
      if (!invoiceSubmissionFilterRoot?.contains(event.target)) closeInvoiceSubmissionFilterMenus();
      if (!agingBucketsFilterRoot?.contains(event.target)) closeAgingBucketsFilterMenus();
      if (!cnAdvFilterRoot?.contains(event.target)) closeCnAdvFilterMenus();
      if (!provisioningWorkspace?.root.contains(event.target)) provisioningWorkspace?.closeMenus();
      if (!writtenOffWorkspace?.root.contains(event.target)) writtenOffWorkspace?.closeMenus();
      if (!visitsCustomerPicker?.contains(event.target) && visitsCustomerPicker) visitsCustomerPicker.open = false;
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCollectionFilterMenus();
        closePlanPortfolioFilterMenus();
        closeVisitsFilterMenus();
        closeInvoiceSubmissionFilterMenus();
        closeAgingBucketsFilterMenus();
        closeCnAdvFilterMenus();
        provisioningWorkspace?.closeMenus();
        writtenOffWorkspace?.closeMenus();
        if (visitsCustomerPicker) visitsCustomerPicker.open = false;
      }
    });
    window.addEventListener("resize", () => Object.values(trendEchartInstances).forEach((chart) => chart?.resize()));
    syncTrendControls();
    setTrendVisibility(toggleBtn.getAttribute("aria-pressed") === "true" || !trendView.hidden);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
