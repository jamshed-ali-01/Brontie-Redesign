import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { deploymentId } = body;

        if (!deploymentId) {
            return NextResponse.json(
                { error: 'deploymentId is required to initiate a rollback.' },
                { status: 400 }
            );
        }

        const vercelToken = process.env.VERCEL_TOKEN;
        const projectId = process.env.VERCEL_PROJECT_ID;
        const teamId = process.env.VERCEL_TEAM_ID;

        if (!vercelToken || !projectId) {
            return NextResponse.json(
                { error: 'Vercel API credentials (VERCEL_TOKEN, VERCEL_PROJECT_ID) are missing from environment variables.' },
                { status: 400 }
            );
        }

        let url = `https://api.vercel.com/v9/projects/${projectId}/rollback/${deploymentId}`;
        if (teamId) {
            url += `?teamId=${teamId}`;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${vercelToken}`,
                'Content-Type': 'application/json',
            },
            // Vercel expects an empty body
            body: JSON.stringify({}),
        });

        if (!res.ok) {
            let errorData: any = {};
            try {
                const text = await res.text();
                errorData = text ? JSON.parse(text) : {};
            } catch (e) {
                // Ignore parse error
            }

            console.error('Vercel Rollback API error:', res.status, errorData);

            const vercelMessage = errorData?.error?.message || errorData?.message || 'Unknown error occurred from Vercel API';
            const errorMessage = `Failed to trigger rollback on Vercel: ${vercelMessage}`;

            return NextResponse.json(
                { error: errorMessage, details: errorData },
                { status: res.status }
            );
        }

        const responseText = await res.text();
        let data = {};
        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                // Ignore parsing errors for non-JSON responses
            }
        }
        return NextResponse.json({ success: true, message: 'Rollback initiated successfully', data });

    } catch (error) {
        console.error('Error triggering Vercel rollback:', error);
        return NextResponse.json({ error: 'Internal server error while attempting rollback.' }, { status: 500 });
    }
}
