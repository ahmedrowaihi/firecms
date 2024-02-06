import React from "react";
import { Button, Typography } from "@firecms/ui";
import { SubscriptionMessageProps } from "../types/subscriptions_message_props";

export function DefaultSubscriptionMessage({ projectId }: SubscriptionMessageProps) {
    return (
        <div className="flex flex-col space-y-1 p-1">
            <Typography variant={"h6"}>Subscription required</Typography>
            <Typography>You have finished your free usage quota.</Typography>
            <Typography>You need an active subscription in order to continue using
                the plugin</Typography>
            <Button
                component={"a"}
                href={`https://app.firecms.co/subscriptions?projectId=${projectId}`}
                color={"warning"}
                rel="noopener noreferrer"
                target="_blank">
                Create a subscription
            </Button>
        </div>
    )
}