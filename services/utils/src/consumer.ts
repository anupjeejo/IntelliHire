import { Kafka } from "kafkajs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendMailConsumer = async () => {
  try {
    const kafka = new Kafka({
      clientId: "mail-service",
      brokers: [process.env.Kafka_Broker || "localhost:9092"],
    });

    const consumer = kafka.consumer(
      { 
        groupId: "mail-service-group" 
      }
    );

    await consumer.connect();

    const topicName = "send-mail";

    await consumer.subscribe(
      { 
        topic: topicName, 
        fromBeginning: false 
      }
    );

    console.log("✅ Mail service consumer started, listening for sending mail");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log("inside consumer.run")
          const { to, subject, html } = JSON.parse(
            message.value?.toString() || "{}"
          );

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          
          console.log("calling transporter sendMail:")
          await transporter.sendMail({
            from: "IntelliHire <no-reply>",
            to,
            subject,
            html,
          });
          console.log("Called transporter sendMail:")
          console.log(`Mail has been sent to ${to}`);
        } catch (error) {
          console.log("Failed to send mail", error);
        }
      },
    });
  } catch (error) {
    console.log("failed to start kafka consumer", error);
  }
};
