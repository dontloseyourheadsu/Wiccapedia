using WiccapediaContracts.Decorations;

namespace WiccapediaContracts.Decorations.Requests;

public record CreateDecorationRequest(DecorationType Type, string Value);
