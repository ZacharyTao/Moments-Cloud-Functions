import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.sendNotificationForNewComment = functions.firestore
    .document('MessageComments/{commentID}')
    .onCreate(async (snapshot, context) => {
        const comment = snapshot.data();
        console.log('Comment:', comment);

        const receiverId = comment.recieverId;
        const senderId = comment.senderId;


        const senderQuerySnapshot = await admin.firestore().collection('Users').where('userId', '==', senderId).get();
        if (senderQuerySnapshot.empty) {
            console.error('Sender not found!');
            throw new Error('Sender not found!');
            return;
        }
        const senderData = senderQuerySnapshot.docs[0].data();

        const receiverQuerySnapshot = await admin.firestore().collection('Users').where('userId', '==', receiverId).get();
        if (receiverQuerySnapshot.empty) {
            console.error('Receiver not found!');
            throw new Error('Receiver not found!');
            return;
        }
        const receiverData = receiverQuerySnapshot.docs[0].data();

        console.log('Receiver:', receiverData);
        const payload = {
            notification: {
                title: `${senderData?.userName} sent a comment`,
                body: comment.comment
            },
            token: receiverData?.FCMtoken
        };
        try {
            const response = await admin.messaging().send(payload);
            console.log('Notification sent successfully:', response);
        } catch (error) {
            console.error('Error sending notification:', error);
            throw new Error('Error sending notification: ' + error);
        }

    });


exports.sendPushNotification = functions.firestore
    .document('Connections/{connectionID}/messages/{messageID}')
    .onCreate(async (snapshot, context) => {

        const message = snapshot.data();
        console.log('Message:', message);

        const connectionDoc = await admin.firestore().collection('Connections').doc(context.params.connectionID).get();

        if (!connectionDoc.exists) {
            console.error('No such connection exists!');
            throw new Error('No such connection exists!');
            return;
        }


        const participantsIds = connectionDoc.data()?.participantsId;
        console.log('Participants:', participantsIds);
        if (!participantsIds) {
            console.error('No participants found!');
            throw new Error('No participants found!');
            return;
        }
        const receiverId = participantsIds.filter((id: string) => id !== message.senderId)[0];

        const senderQuerySnapshot = await admin.firestore().collection('Users').where('userId', '==', message.senderId).get();
        if (senderQuerySnapshot.empty) {
            console.error('Sender not found!');
            throw new Error('Sender not found!');
            return;
        }
        const senderData = senderQuerySnapshot.docs[0].data();

        const receiverQuerySnapshot = await admin.firestore().collection('Users').where('userId', '==', receiverId).get();
        if (receiverQuerySnapshot.empty) {
            console.error('Receiver not found!');
            throw new Error('Receiver not found!');
            return;
        }
        const receiverData = receiverQuerySnapshot.docs[0].data();

        const payload = {
            notification: {
                title: `${senderData.userName}`,
                body: message.caption
            },
            token: receiverData.FCMtoken
        };

        try {
            const response = await admin.messaging().send(payload);
            console.log('Notification sent successfully:', response);
        } catch (error) {
            console.error('Error sending notification:', error);
            throw new Error('Error sending notification: ' + error + 'token is: ' + receiverData.FCMtoken);
        }
    });
