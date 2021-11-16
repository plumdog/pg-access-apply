// Generated from types.json
<% for (const [name, pgType] of Object.entries(it.types)) { %>
<% if (pgType.properties) { %>
export interface <%=it.upperCaseFirst(name) %>Properties {
<% for (const [attrName, attrValue] of Object.entries(pgType.properties.attributes)) { %>
    <%= attrName %><%=attrValue.startsWith('?') ? '?' : ''%>: <%~ attrValue.startsWith('?') ? attrValue.slice(1) : attrValue %>;
<% } %>
}

<% } %>
<% if (pgType.options) { %>
export interface <%=it.upperCaseFirst(name) %>Options {
<% for (const [attrName, attrValue] of Object.entries(pgType.options.attributes)) { %>
    <%= attrName %><%=attrValue.startsWith('?') ? '?' : ''%>: <%~ attrValue.startsWith('?') ? attrValue.slice(1) : attrValue %>;
<% } %>
}

<% } %>
export interface <%=it.upperCaseFirst(name) %> {
<% for (const [attrName, attrValue] of Object.entries(pgType.attributes)) { %>
<% if (pgType.properties) { %>    properties<%=pgType.properties.required ? '' : '?' %>: <%=it.upperCaseFirst(name) %>Properties;
<% } %>
<% if (pgType.options) { %>    options<%=pgType.options.required ? '' : '?' %>: <%=it.upperCaseFirst(name) %>Options;
<% } %>
    <%= attrName %><%=attrValue.startsWith('?') ? '?' : ''%>: <%~ attrValue.startsWith('?') ? attrValue.slice(1) : attrValue %>;
<% } %>
}

<% } %>
