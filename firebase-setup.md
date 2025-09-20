# Firebase Storage Rules

This project uses Firebase Storage to store images for events. To ensure that only authenticated users can upload images, you need to configure the Firebase Storage security rules.

## The Problem

The current security rules for Firebase Storage do not allow users to upload images, which is why the image upload functionality is not working.

## The Solution

To fix this issue, you need to update the Firebase Storage security rules in the Firebase console.

1.  Go to the Firebase console for your project.
2.  Navigate to the "Storage" section.
3.  Click on the "Rules" tab.
4.  Copy the rules from the `storage.rules` file in this project and paste them into the editor in the Firebase console.
5.  Click on the "Publish" button to save the new rules.

After you have updated the rules, the image upload functionality should work as expected.
