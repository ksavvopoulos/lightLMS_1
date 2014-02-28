<%-- The following 4 lines are ASP.NET directives needed when using SharePoint components --%>
<%@ Page Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" language="C#" %>
<%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register Tagprefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<!-- The following tells SharePoint to allow this page to be hosted in an IFrame -->
<WebPartPages:AllowFraming runat="server" />

<html>
	<head>
		<!-- The following scripts are needed when using the SharePoint object model -->
		<script type="text/javascript" src="/_layouts/15/MicrosoftAjax.js"></script>		
		<script type="text/javascript" src="/_layouts/15/sp.runtime.js"></script>
		<script type="text/javascript" src="/_layouts/15/sp.js"></script>		
		<script type="text/javascript" src="/_layouts/15/SP.RequestExecutor.js"></script>	
		
		<!-- add some jQuery -->
		<script type="text/javascript" src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.8.2.min.js"></script>
		
		<!-- Add your CSS styles to the following file -->
		<link rel="Stylesheet" type="text/css" href="../Content/App.css" />		

		<script type="text/javascript">
		    'use strict';
		    // Set the style of the client web part page to be consistent with the host web
		    (function () {
		        var hostUrl = '';
		        if (document.URL.indexOf('?') != -1) {
		            var params = document.URL.split('?')[1].split('&');
		            for (var i = 0; i < params.length; i++) {
		                var p = decodeURIComponent(params[i]);
		                if (/^SPHostUrl=/i.test(p)) {
		                    hostUrl = p.split('=')[1];
		                    document.write('<link rel="stylesheet" href="' + hostUrl + '/_layouts/15/defaultcss.ashx" />');							
		                    break;
		                }
		            }
		        }
		        if (hostUrl == '') {
		            document.write('<link rel="stylesheet" href="/_layouts/15/1033/styles/themable/corev15.css" />');
		        }
		    })();
		</script>
		
		<!-- Common LMS JavaScript functions -->
		<script type="text/javascript" src="https://raw.github.com/ksavvopoulos/javascript-collection/master/spyreqs.js"></script>
		<script type="text/javascript" src="../Scripts/lightLMS_commons.js"></script>
		
		<!-- LMS Application JavaScript -->
		<script type="text/javascript" src="../Scripts/WP_App.js"></script>
		
	</head>

	<body class="clientwebpart-body">
		<div id="lightLMS_div" class="clientwebpart-div">
			<span>
				Your content goes here...
			</span>
		</div>
	</body>
</html>