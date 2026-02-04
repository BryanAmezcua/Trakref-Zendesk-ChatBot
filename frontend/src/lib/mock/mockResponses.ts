import { ChatResponse, RetrievedDocument } from '@/types/chat';

// Simulated delay to mimic API call
export const simulateDelay = (ms: number = 1500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock Zendesk articles for citations
export const mockArticles: RetrievedDocument[] = [
  {
    article_id: 'ZD-001',
    title: 'Getting Started with Trakref',
    url: 'https://support.trakref.com/hc/articles/getting-started',
    chunk_text:
      'Welcome to Trakref! This guide will help you get started with refrigerant tracking and compliance management...',
    score: 0.92,
    metadata: { category: 'Getting Started', section: 'Basics' },
  },
  {
    article_id: 'ZD-002',
    title: 'How to Add a New Asset',
    url: 'https://support.trakref.com/hc/articles/add-new-asset',
    chunk_text:
      'To add a new asset in Trakref, navigate to Assets > Add New Asset. Fill in the required fields including asset name, location, and refrigerant type...',
    score: 0.89,
    metadata: { category: 'Assets', section: 'Management' },
  },
  {
    article_id: 'ZD-003',
    title: 'Recording Refrigerant Transactions',
    url: 'https://support.trakref.com/hc/articles/refrigerant-transactions',
    chunk_text:
      'To record a refrigerant transaction, go to Transactions > New Transaction. Select the transaction type (charge, recovery, or transfer)...',
    score: 0.87,
    metadata: { category: 'Transactions', section: 'Recording' },
  },
  {
    article_id: 'ZD-004',
    title: 'Understanding Compliance Reports',
    url: 'https://support.trakref.com/hc/articles/compliance-reports',
    chunk_text:
      'Trakref generates compliance reports automatically based on your refrigerant data. These reports help you meet EPA Section 608 requirements...',
    score: 0.85,
    metadata: { category: 'Compliance', section: 'Reports' },
  },
  {
    article_id: 'ZD-005',
    title: 'Setting Up User Permissions',
    url: 'https://support.trakref.com/hc/articles/user-permissions',
    chunk_text:
      'Administrators can manage user permissions by going to Settings > Users > Permissions. You can assign roles such as Admin, Manager, or Technician...',
    score: 0.83,
    metadata: { category: 'Settings', section: 'Users' },
  },
  {
    article_id: 'ZD-006',
    title: 'Leak Rate Calculations',
    url: 'https://support.trakref.com/hc/articles/leak-rate-calculations',
    chunk_text:
      'Trakref automatically calculates leak rates for your assets based on refrigerant additions. The leak rate is calculated as: (Total Refrigerant Added / Full Charge) x 100%...',
    score: 0.81,
    metadata: { category: 'Compliance', section: 'Leak Rates' },
  },
];

// Mock responses based on keywords in the user query
export const getMockResponse = (query: string): ChatResponse => {
  const lowerQuery = query.toLowerCase();

  // Simulate different scenarios
  if (lowerQuery.includes('get started') || lowerQuery.includes('getting started') || lowerQuery.includes('begin')) {
    return {
      answer:
        'To get started with Trakref, follow these steps:\n\n1. **Log in** to your Trakref account\n2. **Set up your locations** - Add your facilities and buildings\n3. **Add your assets** - Enter your refrigeration and HVAC equipment\n4. **Configure users** - Set up team members with appropriate permissions\n\nThe Getting Started guide provides a complete walkthrough of the initial setup process.',
      sufficient_context: true,
      missing_info: null,
      citations: [mockArticles[0]],
      confidence: 0.92,
    };
  }

  if (lowerQuery.includes('asset') || lowerQuery.includes('equipment')) {
    return {
      answer:
        'To add a new asset in Trakref:\n\n1. Navigate to **Assets > Add New Asset**\n2. Fill in the required fields:\n   - Asset name\n   - Location\n   - Refrigerant type\n   - Full charge amount\n3. Optionally add equipment details like manufacturer, model, and serial number\n4. Click **Save** to create the asset\n\nOnce created, you can track refrigerant transactions and leak rates for this asset.',
      sufficient_context: true,
      missing_info: null,
      citations: [mockArticles[1]],
      confidence: 0.89,
    };
  }

  if (lowerQuery.includes('transaction') || lowerQuery.includes('refrigerant') || lowerQuery.includes('charge')) {
    return {
      answer:
        'To record a refrigerant transaction:\n\n1. Go to **Transactions > New Transaction**\n2. Select the transaction type:\n   - **Charge** - Adding refrigerant to a system\n   - **Recovery** - Removing refrigerant from a system\n   - **Transfer** - Moving refrigerant between cylinders\n3. Select the asset and enter the amount\n4. Add any notes and technician information\n5. Click **Submit** to record the transaction\n\nAll transactions are automatically factored into leak rate calculations.',
      sufficient_context: true,
      missing_info: null,
      citations: [mockArticles[2]],
      confidence: 0.87,
    };
  }

  if (lowerQuery.includes('compliance') || lowerQuery.includes('report') || lowerQuery.includes('epa')) {
    return {
      answer:
        'Trakref generates compliance reports automatically based on your refrigerant data. These reports help you meet **EPA Section 608** requirements.\n\nKey compliance features:\n- Automatic leak rate tracking\n- Required repair timelines\n- Annual reporting data\n- Audit-ready documentation\n\nAccess reports from **Reports > Compliance Reports** in the main menu.',
      sufficient_context: true,
      missing_info: null,
      citations: [mockArticles[3], mockArticles[5]],
      confidence: 0.88,
    };
  }

  if (lowerQuery.includes('permission') || lowerQuery.includes('user') || lowerQuery.includes('role')) {
    return {
      answer:
        'To manage user permissions:\n\n1. Go to **Settings > Users > Permissions**\n2. Select a user to modify\n3. Assign one of these roles:\n   - **Admin** - Full access to all features\n   - **Manager** - Can manage assets and users at assigned locations\n   - **Technician** - Can record transactions and view assets\n\nYou can also create custom roles with specific permissions.',
      sufficient_context: true,
      missing_info: null,
      citations: [mockArticles[4]],
      confidence: 0.85,
    };
  }

  if (lowerQuery.includes('leak') || lowerQuery.includes('rate')) {
    return {
      answer:
        'Trakref calculates leak rates automatically using this formula:\n\n**Leak Rate = (Total Refrigerant Added / Full Charge) × 100%**\n\nThe system tracks:\n- Annual leak rates for EPA compliance\n- Rolling 12-month calculations\n- Alerts when leak rates exceed thresholds\n\nAssets exceeding 30% (comfort cooling) or 20% (industrial/commercial) leak rates require repair within 30 days per EPA regulations.',
      sufficient_context: true,
      missing_info: null,
      citations: [mockArticles[5]],
      confidence: 0.86,
    };
  }

  // Simulate ambiguous query that needs clarification
  if (lowerQuery.includes('help') && lowerQuery.length < 20) {
    return {
      answer:
        'I can help you with several topics. What would you like to know about?',
      sufficient_context: true,
      missing_info: null,
      citations: [],
      confidence: 0.7,
      clarifying_question:
        'What specific area do you need help with?\n\n• Getting started with Trakref\n• Managing assets and equipment\n• Recording refrigerant transactions\n• Compliance and reporting\n• User permissions and settings',
    };
  }

  // Simulate insufficient context response
  if (
    lowerQuery.includes('price') ||
    lowerQuery.includes('cost') ||
    lowerQuery.includes('billing') ||
    lowerQuery.includes('payment')
  ) {
    return {
      answer:
        'INSUFFICIENT_CONTEXT\n\nI don\'t have information about pricing, billing, or payment details in the available help articles. This type of information is typically handled by our sales or billing team.',
      sufficient_context: false,
      missing_info:
        'Pricing and billing information is not available in the help center articles.',
      citations: [],
      confidence: 0.2,
    };
  }

  // Default response for unknown queries
  return {
    answer:
      'Based on the available documentation, I found some potentially relevant information. Trakref is a refrigerant tracking and compliance management platform that helps you:\n\n- Track refrigerant assets and equipment\n- Record refrigerant transactions\n- Monitor leak rates\n- Generate compliance reports\n\nCould you provide more details about what you\'re trying to accomplish?',
    sufficient_context: true,
    missing_info: null,
    citations: [mockArticles[0], mockArticles[1]],
    confidence: 0.65,
  };
};

// Simulate the agent control loop with retry behavior
export const simulateAgentLoop = async (
  query: string
): Promise<ChatResponse> => {
  // Simulate initial retrieval delay
  await simulateDelay(800);

  // Get mock response based on query
  const response = getMockResponse(query);

  // Simulate additional processing for better answers
  if (response.confidence < 0.7 && response.sufficient_context) {
    // Simulate query rewrite and retry
    await simulateDelay(600);
  }

  return response;
};
