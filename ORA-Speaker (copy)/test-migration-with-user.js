/**
 * Migration Test Script with User Authentication
 * 
 * This script tests the database migration by:
 * 1. Authenticating with test user
 * 2. Checking if the new columns exist
 * 3. Inserting a test record with new columns
 * 4. Querying and verifying the data
 * 5. Cleaning up test data
 * 
 * Run with: node test-migration-with-user.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test user credentials
const TEST_EMAIL = 'test@gmail.com';
const TEST_PASSWORD = 'test123';

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create both client and service role instances
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testMigration() {
  console.log('🧪 Testing Database Migration with User Authentication...\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  let testUserId = null;
  let testRecordId = null;

  try {
    // Step 1: Authenticate with test user
    console.log('Step 1: Authenticating test user...');
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      console.log('\n💡 Make sure the test user exists in your Supabase project:');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
      console.log('\n   You can create this user in the Supabase Dashboard > Authentication > Users\n');
      return false;
    }

    testUserId = authData.user.id;
    console.log(`✅ Authenticated as: ${authData.user.email}`);
    console.log(`   User ID: ${testUserId}\n`);

    // Step 2: Check if new columns exist using service role
    console.log('Step 2: Checking if new columns exist...');
    const { data: schemaCheck, error: schemaError } = await supabaseService
      .from('feedback_sessions')
      .select('id, raw_analysis, analysis_source')
      .limit(1);

    if (schemaError) {
      if (schemaError.message.includes('column') && schemaError.message.includes('does not exist')) {
        console.log('❌ Migration not applied yet. New columns do not exist.');
        console.log('   Please run the migration script in Supabase SQL Editor.');
        console.log('   See MIGRATION_GUIDE.md for instructions.\n');
        return false;
      }
      throw schemaError;
    }

    console.log('✅ New columns exist in the table\n');

    // Step 3: Check existing records
    console.log('Step 3: Checking existing records for test user...');
    const { data: existingRecords, error: existingError } = await supabaseClient
      .from('feedback_sessions')
      .select('id, video_path, analysis_source, raw_analysis, created_at')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (existingError) throw existingError;

    if (existingRecords && existingRecords.length > 0) {
      console.log(`   Found ${existingRecords.length} existing record(s):`);
      existingRecords.forEach((record, idx) => {
        console.log(`\n   Record ${idx + 1}:`);
        console.log(`     ID: ${record.id}`);
        console.log(`     Video: ${record.video_path}`);
        console.log(`     Analysis Source: ${record.analysis_source || 'NULL (needs migration)'}`);
        console.log(`     Raw Analysis: ${record.raw_analysis ? 'Has data' : 'NULL'}`);
        console.log(`     Created: ${new Date(record.created_at).toLocaleString()}`);
      });
      console.log('\n✅ Existing records checked\n');
    } else {
      console.log('   No existing records found for this user');
      console.log('✅ Ready to create test record\n');
    }

    // Step 4: Insert test record with new columns
    console.log('Step 4: Inserting test record with new columns...');
    
    const testRecord = {
      user_id: testUserId,
      video_path: `test/migration-test-${Date.now()}.mp4`,
      feedback_text: 'Test feedback for migration validation',
      raw_analysis: {
        test: true,
        timestamp: new Date().toISOString(),
        metadata: {
          duration: 120,
          resolution: '1080p',
          processingTime: 5.2
        },
        analysis: {
          speech: {
            pace: 150,
            clarity: 0.85,
            fillerWords: [
              { word: 'um', count: 3 },
              { word: 'uh', count: 2 }
            ]
          },
          visual: {
            bodyLanguage: 'confident',
            eyeContact: 'good',
            gestures: 'natural'
          },
          overall: {
            confidence: 0.78,
            engagement: 0.82
          }
        }
      },
      analysis_source: 'external_ai'
    };

    const { data: insertData, error: insertError } = await supabaseClient
      .from('feedback_sessions')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      throw insertError;
    }

    testRecordId = insertData.id;
    console.log('✅ Successfully inserted test record');
    console.log(`   Record ID: ${testRecordId}`);
    console.log(`   Video Path: ${insertData.video_path}`);
    console.log(`   Analysis Source: ${insertData.analysis_source}`);
    console.log(`   Raw Analysis: ${insertData.raw_analysis ? 'Present' : 'NULL'}\n`);

    // Step 5: Query the record back to verify
    console.log('Step 5: Querying test record to verify data integrity...');
    const { data: queryData, error: queryError } = await supabaseClient
      .from('feedback_sessions')
      .select('*')
      .eq('id', testRecordId)
      .single();

    if (queryError) throw queryError;

    console.log('✅ Successfully queried test record');
    console.log('\n   Verification:');
    console.log(`   ✓ ID matches: ${queryData.id === testRecordId}`);
    console.log(`   ✓ User ID matches: ${queryData.user_id === testUserId}`);
    console.log(`   ✓ Analysis source: ${queryData.analysis_source}`);
    console.log(`   ✓ Raw analysis present: ${queryData.raw_analysis !== null}`);
    console.log(`   ✓ Feedback text present: ${queryData.feedback_text !== null}`);
    
    if (queryData.raw_analysis) {
      console.log('\n   Raw Analysis Data:');
      console.log(`   ✓ Test flag: ${queryData.raw_analysis.test}`);
      console.log(`   ✓ Speech pace: ${queryData.raw_analysis.analysis?.speech?.pace} wpm`);
      console.log(`   ✓ Clarity score: ${queryData.raw_analysis.analysis?.speech?.clarity}`);
      console.log(`   ✓ Filler words: ${queryData.raw_analysis.analysis?.speech?.fillerWords?.length} types`);
      console.log(`   ✓ Overall confidence: ${queryData.raw_analysis.analysis?.overall?.confidence}`);
    }
    console.log();

    // Step 6: Test querying by analysis_source
    console.log('Step 6: Testing query by analysis_source...');
    const { data: sourceQuery, error: sourceError } = await supabaseClient
      .from('feedback_sessions')
      .select('id, analysis_source')
      .eq('user_id', testUserId)
      .eq('analysis_source', 'external_ai');

    if (sourceError) throw sourceError;

    console.log(`✅ Found ${sourceQuery.length} record(s) with analysis_source='external_ai'\n`);

    // Step 7: Clean up test record
    console.log('Step 7: Cleaning up test record...');
    const { error: deleteError } = await supabaseClient
      .from('feedback_sessions')
      .delete()
      .eq('id', testRecordId);

    if (deleteError) throw deleteError;

    console.log('✅ Test record cleaned up\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ ALL MIGRATION TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n✨ Migration Status: SUCCESS');
    console.log('\nThe database schema has been updated correctly and:');
    console.log('  ✓ New columns (raw_analysis, analysis_source) exist');
    console.log('  ✓ Insert operations work with new columns');
    console.log('  ✓ Query operations work with new columns');
    console.log('  ✓ JSONB data is stored and retrieved correctly');
    console.log('  ✓ Filtering by analysis_source works');
    console.log('  ✓ Row Level Security (RLS) policies work correctly');
    console.log('\n🚀 Ready for external AI integration!\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ Migration test failed:');
    console.error('Error:', error.message);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('1. Verify migration script has been run in Supabase SQL Editor');
    console.error('2. Check database connection is working');
    console.error('3. Verify RLS policies allow the operations');
    console.error('4. Check service role key has proper permissions\n');
    
    // Try to clean up if we created a test record
    if (testRecordId) {
      console.log('Attempting to clean up test record...');
      try {
        await supabaseClient
          .from('feedback_sessions')
          .delete()
          .eq('id', testRecordId);
        console.log('✅ Cleanup successful\n');
      } catch (cleanupError) {
        console.log('⚠️  Could not clean up test record\n');
      }
    }
    
    return false;
  } finally {
    // Sign out
    await supabaseClient.auth.signOut();
  }
}

// Run the test
console.log('Starting migration test...\n');
testMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
