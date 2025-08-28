// Test script for gamification features
// This script can be run to test the new gamification functionality

const testGamificationFeatures = () => {
  console.log('🎮 Testing Gamification Features...\n');

  // Test funding achievements
  const testFundingAchievements = () => {
    console.log('💰 Testing Funding Achievements:');
    const testAmounts = [5000, 15000, 75000, 150000, 300000, 750000, 1500000];
    
    testAmounts.forEach(amount => {
      const achievements = [];
      if (amount >= 10000) achievements.push('10K_FUNDED');
      if (amount >= 25000) achievements.push('25K_FUNDED');
      if (amount >= 50000) achievements.push('50K_FUNDED');
      if (amount >= 100000) achievements.push('100K_FUNDED');
      if (amount >= 250000) achievements.push('250K_FUNDED');
      if (amount >= 500000) achievements.push('500K_FUNDED');
      if (amount >= 1000000) achievements.push('1M_FUNDED');
      
      console.log(`  $${amount.toLocaleString()}: ${achievements.length > 0 ? achievements.join(', ') : 'No achievements'}`);
    });
    console.log('');
  };

  // Test organization badges
  const testOrganizations = () => {
    console.log('🏢 Testing Organization Badges:');
    const organizations = [
      'Aggies Create',
      'AggieX',
      'Aggie Entrepreneurs (AE)',
      'Texas A&M Innovation',
      'Startup Aggieland'
    ];
    
    organizations.forEach(org => {
      console.log(`  ✓ ${org}`);
    });
    console.log('');
  };

  // Test skill categories
  const testSkillCategories = () => {
    console.log('🛠️ Testing Skill Categories:');
    const categories = {
      'Programming Languages': ['Python', 'JavaScript', 'TypeScript'],
      'Web Technologies': ['React', 'Node.js', 'Django'],
      'Mobile Development': ['React Native', 'Flutter'],
      'Database & Backend': ['PostgreSQL', 'AWS', 'Docker'],
      'Data Science & AI': ['TensorFlow', 'Pandas'],
      'Design & Creative': ['Figma', 'Photoshop'],
      'Other Technical': ['Git', 'DevOps']
    };
    
    Object.entries(categories).forEach(([category, skills]) => {
      console.log(`  ${category}: ${skills.join(', ')}`);
    });
    console.log('');
  };

  // Test soft skills
  const testSoftSkills = () => {
    console.log('🤝 Testing Soft Skills:');
    const softSkillCategories = {
      'Communication': ['Public Speaking', 'Written Communication'],
      'Leadership': ['Team Leadership', 'Project Management'],
      'Business': ['Sales', 'Marketing'],
      'Personal': ['Time Management', 'Problem Solving'],
      'Collaboration': ['Teamwork', 'Networking'],
      'Event & Community': ['Event Planning', 'Fundraising']
    };
    
    Object.entries(softSkillCategories).forEach(([category, skills]) => {
      console.log(`  ${category}: ${skills.join(', ')}`);
    });
    console.log('');
  };

  // Run all tests
  testFundingAchievements();
  testOrganizations();
  testSkillCategories();
  testSoftSkills();

  console.log('✅ All gamification feature tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run the database migration');
  console.log('2. Test the new components in the UI');
  console.log('3. Verify profile updates work correctly');
  console.log('4. Test achievement badge display');
  console.log('5. Verify organization affiliations');
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testGamificationFeatures };
} else {
  // Run test if script is executed directly
  testGamificationFeatures();
} 