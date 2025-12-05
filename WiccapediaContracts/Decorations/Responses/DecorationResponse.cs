using WiccapediaContracts.Decorations;

namespace WiccapediaContracts.Decorations.Responses;

public record DecorationResponse(int Id, DecorationType Type, string Value);
