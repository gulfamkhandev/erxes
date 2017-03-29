/* global Assets: false */

import AWS from 'aws-sdk';
import Handlebars from 'handlebars';
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { _ } from 'meteor/underscore';
import { Notifications } from 'meteor/erxes-notifications';

// save binary data to amazon s3
export const uploadFile = ({ name, data }) => {
  const accessKeyId = Meteor.settings.AWS_accessKeyId;
  const secretAccessKey = Meteor.settings.AWS_secretAccessKey;
  const bucket = Meteor.settings.AWS_bucket;
  const prefix = Meteor.settings.AWS_prefix || '';

  // check credentials
  if (!(accessKeyId || secretAccessKey || bucket)) {
    return {
      status: 'error',
      data: 'Security credentials are not configured',
    };
  }

  // initialize s3
  const s3 = new AWS.S3({ accessKeyId, secretAccessKey });

  // wait for putObject response
  const syncPutObject = Meteor.wrapAsync(s3.putObject, s3);

  // generate unique name
  const fileName = `${prefix}${Math.random()}${name}`;

  // create buffer from file data
  const buffer = new Buffer(data);

  // call putObject
  const response = syncPutObject({
    Bucket: bucket,
    Key: fileName,
    Body: buffer,
    ACL: 'public-read',
  });

  response.url = `https://s3.amazonaws.com/${bucket}/${fileName}`;

  return response;
};


// send email helpers ====================
function applyTemplate(data, templateName) {
  let template = Assets.getText(`emailTemplates/${templateName}.html`);

  template = Handlebars.compile(template);

  return template(data);
}

export const sendEmail = ({ to, subject, template }) => {
  const { isCustom, data, name } = template;

  // generate email content by given template
  const content = applyTemplate(data, name);

  let html = '';

  // for example brand related emails can be totally different
  if (isCustom) {
    html = content;

  // invitation, notification emails can be same
  } else {
    html = applyTemplate({ content }, 'base');
  }

  // do not send email in test mode
  if (Meteor.isTest) {
    return;
  }

  Email.send({
    from: Meteor.settings.NO_REPLY_EMAIL,
    to,
    subject,
    html,
  });
};

// send notification helper
export const sendNotification = (_doc) => {
  const doc = _doc;

  // Splitting receivers
  const receivers = doc.receivers;
  delete doc.receivers;

  // Inserting entry to every receiver
  _.each(receivers, (receiverId) => {
    doc.receiver = receiverId;

    // create notification
    const response = Notifications.create(_.clone(doc));

    // if receiver did not disable to get this notification
    if (response === 'ok') {
      const receiver = Meteor.users.findOne({ _id: receiverId });
      const details = receiver.details;

      // if receiver did not disable email notification then send email
      if (!(details && details.getNotificationByEmail === false)) {
        sendEmail({
          to: receiver.emails[0].address,
          subject: 'Notification',
          template: {
            name: 'notification',
            data: {
              notification: doc,
            },
          },
        });
      }
    }
  });
};
