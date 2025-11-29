# Wiccapedia

## Google Authentication Setup

To run the Wiccapedia Grimoire with Google Authentication, you need to configure a project in the Google Cloud Console and update the application settings.

### 1. Google Cloud Console Configuration

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
    - Select **External** (unless you have a Google Workspace organization).
    - Fill in the required app information (App name, User support email, Developer contact information).
    - Click **Save and Continue**.
4.  Navigate to **Credentials**.
5.  Click **Create Credentials** > **OAuth client ID**.
6.  Select **Web application** as the Application type.
7.  Configure the following settings:
    - **Name**: `Wiccapedia Local` (or your preferred name).
    - **Authorized JavaScript origins**:
      - `https://localhost:5265`
    - **Authorized redirect URIs**:
      - `https://localhost:5265/authentication/login-callback`
      - `https://localhost:5265/authentication/logout-callback`
8.  **Important for Implicit Flow**:
    - If you are using the `id_token` response type (default configuration), ensure you check the box for **Enable Implicit Grant** (specifically **ID tokens**) if available.
9.  Click **Create**.
10. Copy the **Client ID**.
    - **Note**: Do **NOT** use the Client Secret. Blazor WebAssembly runs entirely in the browser, so it cannot safely store secrets.

### 2. Application Configuration

1.  Open `WiccapediaGrimoire/wwwroot/appsettings.json` (or `appsettings.Development.json` for local testing).
2.  Update the `Local` configuration object with your Google Client ID:

```json
{
  "Local": {
    "Authority": "https://accounts.google.com",
    "ClientId": "YOUR_GOOGLE_CLIENT_ID_HERE",
    "PostLogoutRedirectUri": "https://localhost:5265/authentication/logout-callback",
    "RedirectUri": "https://localhost:5265/authentication/login-callback",
    "ResponseType": "id_token"
  }
}
```

### Security Warning

- **Public Values**: The `ClientId` is visible to anyone visiting the site because it is sent to the browser. This is normal for Single Page Applications (SPAs).
- **Private Values**: Never put a `ClientSecret` in `appsettings.json` or any client-side code.
- **Source Control**: If you are contributing to this repository, **do not commit your personal `ClientId`**.
  - Use `appsettings.Development.json` for your local credentials and ensure it is excluded from git, or revert changes to `appsettings.json` before committing.
