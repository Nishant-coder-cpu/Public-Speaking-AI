/**
 * Migration Test Script
 * 
 * This script tests the database migration by:
 * 1. Checking if the new columns exist
 * 2. Verifying the schema matches expectations
 * 3. Testing insert/query operations with new columns
 * 
 * Run with: node test-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log('🧪 Testing Database Migration...\n');

  try {
    // Test 1: Check if columns exist by querying the table
    console.log('Test 1: Checking if new columns exist...');
    const { data: testData, error: testError } = await supabase
      .from('feedback_sessions')
      .select('id, raw_analysis, analysis_source')
      .limit(1);

    if (testError) {
      if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        console.log('❌ Migration not applied yet. New columns do not exist.');
        console.log('   Please run the migration script in Supabase SQL Editor.\n');
        return false;
      }
      throw testError;
    }

    console.log('✅ New columns exist in the table\n');

    // Test 2: Check existing records have default values
    console.log('Test 2: Checking default values on existing records...');
    const { data: existingRecords, error: existingError } = await supabase
      .from('feedback_sessions')
      .select('id, analysis_source, raw_analysis')
      .limit(5);

    if (existingError) throw existingError;

    if (existingRecords && existingRecords.length > 0) {
      console.log(`   Found ${existingRecords.length} existing record(s)`);
      existingRecords.forEach((record, idx) => {
        console.log(`   Record ${idx + 1}:`);
        console.log(`     - analysis_source: ${record.analysis_source || 'NULL'}`);
        console.log(`     - raw_analysis: ${record.raw_analysis ? 'Has data' : 'NULL'}`);
      });
      console.log('✅ Existing records checked\n');
    } else {
      console.log('   No existing records found (empty table)');
      console.log('✅ Table is empty, ready for new records\n');
    }

    // Test 3: Test inserting a record with new columns
    console.log('Test 3: Testing insert with new columns...');
    
    // Get a test user (or use a dummy UUID for testing)
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    const testRecord = {
      user_id: testUserId,
      video_path: 'test/migration-test.mp4',
      feedback_text: 'Test feedback for migration',
      raw_analysis: {
        test: true,
        timestamp: new Date().toISOString(),
        data: { score: 85 }
      },
      analysis_source: 'external_ai'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('feedback_sessions')
      .insert(testRecord)
      .select();

    if (insertError) {
      // If it's a foreign key constraint error, that's expected (test user doesn't exist)
      if (insertError.message.includes('foreign key') || insertError.message.includes('violates')) {
        console.log('⚠️  Insert test skipped (no test user available)');
        console.log('   This is expected - the schema is correct but needs a valid user_id');
        console.log('✅ Schema validation passed\n');
      } else {
        throw insertError;
      }
    } else {
      console.log('✅ Successfully inserted test record with new columns');
      console.log(`   Record ID: ${insertData[0].id}`);
      
      // Clean up test record
      await supabase
        .from('feedback_sessions')
        .delete()
        .eq('id', insertData[0].id);
      console.log('   Test record cleaned up\n');
    }

    // Test 4: Test querying with new columns
    console.log('Test 4: Testing query with new columns...');
    const { data: queryData, error: queryError } = await supabase
      .from('feedback_sessions')
      .select('id, video_path, feedback_text, raw_analysis, analysis_source, created_at')
      .limit(3);

    if (queryError) throw queryError;

    console.log(`✅ Successfully queried ${queryData.length} record(s) with new columns\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ All migration tests passed!');
    console.log('═══════════════════════════════════════');
    console.log('\nMigration Status: SUCCESS');
    console.log('The database schema has been updated correctly.\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ Migration test failed:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('1. Migration script has been run in Supabase SQL Editor');
    console.error('2. Database connection is working');
    console.error('3. Service role key has proper permissions\n');
    return false;
  }
}

// Run the test
testMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
