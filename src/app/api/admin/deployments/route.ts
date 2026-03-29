import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const vercelToken = process.env.VERCEL_TOKEN;
        const projectId = process.env.VERCEL_PROJECT_ID;
        const teamId = process.env.VERCEL_TEAM_ID;

        if (!vercelToken || !projectId) {
            return NextResponse.json(
                { error: 'Vercel API credentials (VERCEL_TOKEN, VERCEL_PROJECT_ID) are missing from environment variables.' },
                { status: 400 }
            );
        }

        // Build URL, include teamId if present
        let url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&target=production&state=READY&limit=20`;
        if (teamId) {
            url += `&teamId=${teamId}`;
        }

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${vercelToken}`,
                'Content-Type': 'application/json',
            },
            // Do not cache this request so we always get fresh deployments
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Vercel API error:', res.status, errorData);
            return NextResponse.json(
                { error: 'Failed to fetch deployments from Vercel.', details: errorData },
                { status: res.status }
            );
        }

        const deploymentsData = await res.json();

        // Also fetch project details to know which deployment is CURRENTLY active in production
        let currentDeploymentId = null;
        let projectUrl = `https://api.vercel.com/v9/projects/${projectId}`;
        if (teamId) {
            projectUrl += `?teamId=${teamId}`;
        }

        try {
            const projRes = await fetch(projectUrl, {
                headers: { Authorization: `Bearer ${vercelToken}` },
                cache: 'no-store'
            });
            if (projRes.ok) {
                const projData = await projRes.json();
                currentDeploymentId = projData.targets?.production?.id;
            }
        } catch (e) {
            console.error('Failed to get current project target', e);
        }

        return NextResponse.json({
            deployments: deploymentsData.deployments,
            currentDeploymentId
        });

    } catch (error) {
        console.error('Error fetching Vercel deployments:', error);
        return NextResponse.json({ error: 'Internal server error while fetching deployments.' }, { status: 500 });
    }
}
