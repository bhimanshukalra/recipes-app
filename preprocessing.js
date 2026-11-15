class ShareExtensionPreprocessor {
  run(args) {
    const jsonld = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ].map((s) => s.textContent);
    args.completionFunction({
      url: window.location.href,
      title: document.title,
      jsonld,
    });
  }
}
var ExtensionPreprocessingJS = new ShareExtensionPreprocessor();
