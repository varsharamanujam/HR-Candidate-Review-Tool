import weasyprint

html = weasyprint.HTML(string="<h1>Hello, WeasyPrint!</h1>")
pdf = html.write_pdf()
print("PDF generated successfully!")
