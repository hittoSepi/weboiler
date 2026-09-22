'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const createMailer=require('../lib/mailer');
const createAuth=require('../lib/auth-store');
const createAnalytics=require('../lib/analytics');
const resolveSecret=require('../lib/secret');

async function run(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'weboiler-services-'));
  try{
    const secretFile=path.join(root,'secret');
    const secret=resolveSecret({file:secretFile,production:false});
    assert.equal(resolveSecret({file:secretFile,production:false}),secret);
    assert.throws(()=>resolveSecret({file:secretFile,production:true}),/SESSION_SECRET/);
    const mailFile=path.join(root,'mail.json');
    let delivery,transportConfig;
    const makeMailer=()=>createMailer({filePath:mailFile,encryptionSecret:secret,createTransport:options=>{transportConfig=options;return {sendMail:async message=>{delivery=message;}};},createResend:key=>({emails:{send:async message=>{assert.equal(key,'test-api-secret');delivery=message;return {data:{id:'test-message'}};}}})});
    let mailer=makeMailer();
    assert.equal((await mailer.sendContact({})).skipped,true);
    mailer.saveSettings({provider:'smtp',recipient:'recipient@example.test',fromEmail:'sender@example.test',smtpHost:'smtp.example.test',smtpUser:'test',smtpPassword:'test-smtp-secret',smtpPort:465,smtpSecure:true});
    assert.ok(!fs.readFileSync(mailFile,'utf8').includes('test-smtp-secret'));
    assert.equal(mailer.publicSettings().smtpPassword,undefined);
    mailer=makeMailer();
    await mailer.sendContact({name:'Testaaja',email:'reply@example.test',phone:'123',message:'Sisältö',createdAt:new Date().toISOString()});
    assert.equal(transportConfig.auth.pass,'test-smtp-secret','Secret decrypts after restarting mailer');
    assert.equal(transportConfig.secure,true);
    assert.equal(delivery.replyTo,'reply@example.test');
    assert.match(delivery.text,/Sisältö/);
    mailer.saveSettings({...mailer.publicSettings(),smtpPassword:''});
    await mailer.sendTest();
    assert.equal(transportConfig.auth.pass,'test-smtp-secret','Empty input retains password');
    mailer.saveSettings({...mailer.publicSettings(),provider:'resend',resendApiKey:'test-api-secret'});
    await makeMailer().sendTest();
    assert.deepEqual(delivery.to,['recipient@example.test']);
    assert.ok(!fs.readFileSync(mailFile,'utf8').includes('test-api-secret'));
    const failedMailer=createMailer({filePath:mailFile,encryptionSecret:secret,createResend:()=>({emails:{send:async()=>({error:{message:'Test provider failure'}})}})});
    await assert.rejects(()=>failedMailer.sendTest(),/Test provider failure/);

    const authFile=path.join(root,'auth.json');
    const config={filePath:authFile,fallbackUsername:'admin',fallbackPassword:'initial-password'};
    const auth=createAuth(config);
    assert.throws(()=>auth.update({username:'new-admin',currentPassword:'wrong',newPassword:'new-password-long'}));
    auth.update({username:'new-admin',currentPassword:'initial-password',newPassword:'new-password-long'});
    assert.equal(createAuth(config).authenticate('new-admin','new-password-long'),true);
    assert.equal(createAuth(config).authenticate('admin','initial-password'),false);
    assert.ok(!fs.readFileSync(authFile,'utf8').includes('new-password-long'));

    const analyticsFile=path.join(root,'analytics.json');
    const analytics=createAnalytics({filePath:analyticsFile});
    const event={visitorId:'visitor-123456789',sessionId:'session-123456789',event:'view',durationMs:5000,ip:'127.0.0.1',userAgent:'must-not-store'};
    analytics.record(event);analytics.record({...event,event:'heartbeat',durationMs:15000});
    const totals=analytics.summary().today;
    assert.equal(totals.visitors,1);assert.equal(totals.visits,1);assert.equal(totals.pageViews,1);assert.equal(totals.averageDurationMs,15000);
    const stored=fs.readFileSync(analyticsFile,'utf8');
    assert.ok(!stored.includes('127.0.0.1')&&!stored.includes('must-not-store')&&!stored.includes('visitor-123456789'));
    console.log('Services tests OK (local mail adapters; no external email sent)');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
